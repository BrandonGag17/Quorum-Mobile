create extension if not exists pgcrypto;

create table if not exists public.notificacion (
    id uuid primary key default gen_random_uuid(),
    destinatario_id uuid not null references public.usuario(id) on delete cascade,
    origen_id uuid null references public.usuario(id) on delete set null,
    id_grupo uuid null references public.grupo(id) on delete cascade,
    id_evento uuid null references public.evento(id) on delete cascade,
    id_encuesta uuid null references public.encuesta(id) on delete cascade,
    id_opcion_encuesta uuid null references public.opcion_encuesta(id) on delete cascade,
    recordatorio_dias_antes smallint null,
    tipo text not null check (
        tipo in (
            'grupo_agregado',
            'propuesta_creada',
            'evento_creado',
            'sugerencia_fecha_hora',
            'votacion_cerrada',
            'recordatorio_juntada',
            'juntada_cancelada'
        )
    ),
    titulo text not null check (btrim(titulo) <> ''),
    descripcion text not null default '',
    payload jsonb not null default '{}'::jsonb,
    creada_en timestamptz not null default now(),
    leida_en timestamptz null,
    constraint notificacion_payload_is_object check (jsonb_typeof(payload) = 'object'),
    constraint notificacion_recordatorio_dias check (
        (tipo = 'recordatorio_juntada' and recordatorio_dias_antes is not null and recordatorio_dias_antes in (0, 2, 4))
        or (tipo <> 'recordatorio_juntada' and recordatorio_dias_antes is null)
    )
);

create index if not exists idx_notificacion_destinatario on public.notificacion(destinatario_id, creada_en desc);
create index if not exists idx_notificacion_leida on public.notificacion(destinatario_id, leida_en);
create index if not exists idx_notificacion_tipo on public.notificacion(tipo, creada_en desc);
create index if not exists idx_notificacion_evento on public.notificacion(id_evento) where id_evento is not null;
create index if not exists idx_notificacion_encuesta on public.notificacion(id_encuesta) where id_encuesta is not null;
create unique index if not exists uq_notificacion_propuesta_creada
    on public.notificacion(destinatario_id, id_encuesta)
    where tipo = 'propuesta_creada' and id_encuesta is not null;
create unique index if not exists uq_notificacion_sugerencia_fecha_hora
    on public.notificacion(destinatario_id, id_opcion_encuesta)
    where tipo = 'sugerencia_fecha_hora' and id_opcion_encuesta is not null;
create unique index if not exists uq_notificacion_evento_creado
    on public.notificacion(destinatario_id, id_evento)
    where tipo = 'evento_creado' and id_evento is not null;
create unique index if not exists uq_notificacion_cierre_votacion
    on public.notificacion(destinatario_id, id_encuesta)
    where tipo = 'votacion_cerrada' and id_encuesta is not null;
create unique index if not exists uq_notificacion_recordatorio
    on public.notificacion(destinatario_id, id_evento, recordatorio_dias_antes)
    where tipo = 'recordatorio_juntada' and id_evento is not null;
create unique index if not exists uq_notificacion_cancelacion
    on public.notificacion(destinatario_id, id_evento)
    where tipo = 'juntada_cancelada' and id_evento is not null;

create table if not exists public.dispositivo_push (
    id uuid primary key default gen_random_uuid(),
    id_usuario uuid not null references public.usuario(id) on delete cascade,
    token text not null,
    plataforma text not null check (plataforma in ('ios', 'android', 'web')),
    nombre_dispositivo text null,
    activo boolean not null default true,
    ultimo_registro_en timestamptz not null default now(),
    creado_en timestamptz not null default now(),
    unique (token),
    unique (id_usuario, token)
);

create index if not exists idx_dispositivo_push_usuario on public.dispositivo_push(id_usuario, activo, ultimo_registro_en desc);

create table if not exists public.notificacion_push_envio (
    notificacion_id uuid primary key references public.notificacion(id) on delete cascade,
    estado text not null check (estado in ('enviando', 'enviado', 'parcial', 'fallido', 'sin_dispositivos')),
    total_dispositivos integer not null default 0 check (total_dispositivos >= 0),
    aceptados_por_expo integer not null default 0 check (aceptados_por_expo >= 0),
    fallidos integer not null default 0 check (fallidos >= 0),
    iniciado_en timestamptz not null default now(),
    finalizado_en timestamptz null
);

alter table public.notificacion enable row level security;
alter table public.dispositivo_push enable row level security;
alter table public.notificacion_push_envio enable row level security;
revoke all on table public.notificacion from anon, authenticated;
revoke all on table public.dispositivo_push from anon, authenticated;
revoke all on table public.notificacion_push_envio from public, anon, authenticated, service_role;
grant select on table public.notificacion to authenticated;
grant update (leida_en) on table public.notificacion to authenticated;
grant select, delete on table public.dispositivo_push to authenticated;
grant update (plataforma, nombre_dispositivo, activo, ultimo_registro_en)
    on table public.dispositivo_push to authenticated;
grant select on table public.notificacion, public.dispositivo_push to service_role;
grant update (activo) on table public.dispositivo_push to service_role;
grant update (estado, total_dispositivos, aceptados_por_expo, fallidos, finalizado_en)
    on table public.notificacion_push_envio to service_role;

create or replace function public.claim_notificacion_push(p_notificacion_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_inserted integer;
begin
    insert into public.notificacion_push_envio (notificacion_id, estado)
    select n.id, 'enviando'
    from public.notificacion n
    where n.id = p_notificacion_id
    on conflict (notificacion_id) do nothing;

    get diagnostics v_inserted = row_count;
    return v_inserted = 1;
end;
$$;

revoke all on function public.claim_notificacion_push(uuid) from public, anon, authenticated;
grant execute on function public.claim_notificacion_push(uuid) to service_role;

create or replace function public.crear_notificacion(
    p_destinatario_id uuid,
    p_origen_id uuid,
    p_tipo text,
    p_titulo text,
    p_descripcion text,
    p_payload jsonb default '{}'::jsonb,
    p_grupo_id uuid default null,
    p_evento_id uuid default null,
    p_encuesta_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_destinatario uuid := p_destinatario_id;
    v_origen uuid := p_origen_id;
    v_id uuid;
begin
    if v_destinatario is null then
        raise exception 'El destinatario de la notificacion es obligatorio';
    end if;

    if v_origen = v_destinatario then
        v_origen := null;
    end if;

    insert into public.notificacion (
        destinatario_id,
        origen_id,
        id_grupo,
        id_evento,
        id_encuesta,
        tipo,
        titulo,
        descripcion,
        payload
    ) values (
        v_destinatario,
        v_origen,
        p_grupo_id,
        p_evento_id,
        p_encuesta_id,
        p_tipo,
        btrim(p_titulo),
        coalesce(p_descripcion, ''),
        coalesce(p_payload, '{}'::jsonb)
    ) returning id into v_id;

    return v_id;
end;
$$;

revoke all on function public.crear_notificacion(uuid, uuid, text, text, text, jsonb, uuid, uuid, uuid) from public, anon, authenticated;

create or replace function public.registrar_dispositivo_push(
    p_token text,
    p_plataforma text,
    p_nombre_dispositivo text default null
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_usuario_id uuid := auth.uid();
    v_dispositivo_id uuid;
begin
    if v_usuario_id is null then
        raise exception 'Se requiere una sesion autenticada';
    end if;

    if p_token is null or length(p_token) > 300 or
       p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' then
        raise exception 'El token de Expo no es valido';
    end if;

    if p_plataforma not in ('ios', 'android', 'web') then
        raise exception 'La plataforma no es valida';
    end if;

    insert into public.dispositivo_push (
        id_usuario, token, plataforma, nombre_dispositivo, activo, ultimo_registro_en
    ) values (
        v_usuario_id, p_token, p_plataforma, nullif(btrim(p_nombre_dispositivo), ''), true, now()
    )
    on conflict (id_usuario, token) do update
       set plataforma = excluded.plataforma,
           nombre_dispositivo = excluded.nombre_dispositivo,
           activo = true,
           ultimo_registro_en = now()
    returning id into v_dispositivo_id;

    return v_dispositivo_id;
end;
$$;

revoke all on function public.registrar_dispositivo_push(text, text, text) from public, anon;
grant execute on function public.registrar_dispositivo_push(text, text, text) to authenticated;

create or replace function public.genera_notificacion_grupo_agregado()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_grupo public.grupo%rowtype;
begin
    select * into v_grupo
    from public.grupo
    where id = new.id_grupo;

    if v_grupo.id is null then
        return new;
    end if;

    if (
        auth.uid() is not null and new.id_usuario = auth.uid()
    ) or (
        auth.uid() is null and new.id_usuario = v_grupo.id_creador
    ) then
        return new;
    end if;

    perform public.crear_notificacion(
        p_destinatario_id => new.id_usuario,
        p_origen_id => auth.uid(),
        p_tipo => 'grupo_agregado',
        p_titulo => 'Te añadieron a un grupo',
        p_descripcion => 'Ahora formás parte de ' || v_grupo.nombre || '.',
        p_payload => jsonb_build_object(
            'grupo_id', v_grupo.id,
            'grupo_nombre', v_grupo.nombre
        ),
        p_grupo_id => v_grupo.id
    );

    return new;
end;
$$;

create or replace function public.notificar_sugerencias_fecha_hora(p_opcion_ids uuid[])
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
    insert into public.notificacion (
        destinatario_id,
        origen_id,
        id_grupo,
        id_evento,
        id_encuesta,
        id_opcion_encuesta,
        tipo,
        titulo,
        descripcion,
        payload
    )
    select distinct
        ug.id_usuario,
        coalesce(auth.uid(), e.id_creador),
        g.id,
        e.id,
        survey.id,
        option_row.id,
        'sugerencia_fecha_hora',
        'Nueva sugerencia de fecha u hora',
        'Se agregó una sugerencia a la propuesta ' || survey.pregunta || '.',
        jsonb_build_object(
            'grupo_id', g.id,
            'grupo_nombre', g.nombre,
            'evento_id', e.id,
            'encuesta_id', survey.id,
            'opcion_id', option_row.id,
            'sugerencia', option_row.descripcion,
            'tipo', option_row.tipo
        )
    from unnest(p_opcion_ids) changed(id)
    join public.opcion_encuesta option_row on option_row.id = changed.id
    join public.encuesta survey on survey.id = option_row.id_encuesta
    join public.evento e on e.id = survey.id_evento and e.estado = 'planificacion'
    join public.grupo g on g.id = e.id_grupo
    join public.usuario_grupo ug on ug.id_grupo = e.id_grupo
    where survey.activa is true
      and lower(coalesce(option_row.tipo, '')) in ('fecha', 'hora', 'horario', 'fecha_hora')
      and ug.id_usuario is distinct from coalesce(auth.uid(), e.id_creador)
      and exists (
          select 1
          from public.notificacion original
          where original.tipo = 'propuesta_creada'
            and original.id_encuesta = survey.id
            and original.destinatario_id = ug.id_usuario
      )
    on conflict (destinatario_id, id_opcion_encuesta)
      where tipo = 'sugerencia_fecha_hora' and id_opcion_encuesta is not null
      do nothing;
end;
$$;

revoke all on function public.notificar_sugerencias_fecha_hora(uuid[]) from public, anon, authenticated;

create or replace function public.genera_notificacion_propuesta_creada()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_notified_surveys uuid[];
    v_suggestion_option_ids uuid[];
begin
    select array_agg(distinct survey.id)
      into v_notified_surveys
      from (
          select distinct id_encuesta
          from inserted_options
      ) option_rows
      join public.encuesta survey on survey.id = option_rows.id_encuesta
      join public.notificacion existing
        on existing.id_encuesta = survey.id
       and existing.tipo = 'propuesta_creada';

    insert into public.notificacion (
        destinatario_id,
        origen_id,
        id_grupo,
        id_evento,
        id_encuesta,
        tipo,
        titulo,
        descripcion,
        payload
    )
    select
        ug.id_usuario,
        coalesce(auth.uid(), e.id_creador),
        g.id,
        e.id,
        survey.id,
        'propuesta_creada',
        'Nueva propuesta de juntada',
        'Hay una nueva propuesta en ' || g.nombre || '.',
        jsonb_build_object(
            'grupo_id', g.id,
            'grupo_nombre', g.nombre,
            'evento_id', e.id,
            'encuesta_id', survey.id
        )
    from (
        select distinct id_encuesta
        from inserted_options
    ) option_rows
    join public.encuesta survey on survey.id = option_rows.id_encuesta
    join public.evento e on e.id = survey.id_evento and e.estado = 'planificacion'
    join public.grupo g on g.id = e.id_grupo
    join public.usuario_grupo ug on ug.id_grupo = e.id_grupo
    where survey.activa is true
      and ug.id_usuario is distinct from coalesce(auth.uid(), e.id_creador)
    on conflict (destinatario_id, id_encuesta)
      where tipo = 'propuesta_creada' and id_encuesta is not null
      do nothing;

    if v_notified_surveys is not null then
        select array_agg(distinct option_row.id)
          into v_suggestion_option_ids
          from inserted_options inserted
          join public.opcion_encuesta option_row on option_row.id = inserted.id
          join public.encuesta survey on survey.id = option_row.id_encuesta
         where survey.id = any(v_notified_surveys)
           and lower(coalesce(option_row.tipo, '')) in ('fecha', 'hora', 'horario', 'fecha_hora');

        if v_suggestion_option_ids is not null then
            perform public.notificar_sugerencias_fecha_hora(v_suggestion_option_ids);
        end if;
    end if;

    return null;
end;
$$;

create or replace function public.genera_notificacion_cierre_votacion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_evento public.evento%rowtype;
    v_grupo public.grupo%rowtype;
    v_actor uuid;
begin
    if old.activa is distinct from true or new.activa is distinct from false then
        return new;
    end if;

    select * into v_evento from public.evento where id = new.id_evento;
    if v_evento.id is null then
        return new;
    end if;

    select * into v_grupo from public.grupo where id = v_evento.id_grupo;
    if v_grupo.id is null then
        return new;
    end if;

    v_actor := coalesce(auth.uid(), v_evento.id_creador);

    insert into public.notificacion (
        destinatario_id,
        origen_id,
        id_grupo,
        id_evento,
        id_encuesta,
        tipo,
        titulo,
        descripcion,
        payload
    )
    select
        ug.id_usuario,
        v_actor,
        v_grupo.id,
        v_evento.id,
        new.id,
        'votacion_cerrada',
        'Votación cerrada',
        'La votación para ' || new.pregunta || ' se cerró.',
        jsonb_build_object(
            'grupo_id', v_grupo.id,
            'evento_id', v_evento.id,
            'encuesta_id', new.id
        )
    from public.usuario_grupo ug
    where ug.id_grupo = v_evento.id_grupo
      and ug.id_usuario is distinct from v_actor
    on conflict (destinatario_id, id_encuesta)
      where tipo = 'votacion_cerrada' and id_encuesta is not null
      do nothing;

    return new;
end;
$$;

create or replace function public.genera_notificacion_evento()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_grupo public.grupo%rowtype;
    v_notificacion_tipo text;
    v_titulo text;
    v_descripcion text;
    v_actor uuid;
begin
    select * into v_grupo from public.grupo where id = new.id_grupo;
    if v_grupo.id is null then
        return new;
    end if;
    v_actor := coalesce(auth.uid(), new.id_creador);

    if tg_op = 'INSERT' then
        if new.estado is distinct from 'confirmado' then
            return new;
        end if;
        v_notificacion_tipo := 'evento_creado';
        v_titulo := 'Nuevo evento';
        v_descripcion := 'Se creó el evento ' || new.nombre || '.';
    elsif new.estado = 'confirmado' and old.estado is distinct from new.estado then
        v_notificacion_tipo := 'evento_creado';
        v_titulo := 'Nuevo evento';
        v_descripcion := 'Se creó el evento ' || new.nombre || '.';
    elsif new.estado = 'cancelado' and old.estado is distinct from new.estado then
        v_notificacion_tipo := 'juntada_cancelada';
        v_titulo := 'Juntada cancelada';
        v_descripcion := 'La juntada ' || new.nombre || ' fue cancelada.';
    else
        return new;
    end if;

    insert into public.notificacion (
        destinatario_id,
        origen_id,
        id_grupo,
        id_evento,
        tipo,
        titulo,
        descripcion,
        payload
    )
    select
        ug.id_usuario,
        v_actor,
        v_grupo.id,
        new.id,
        v_notificacion_tipo,
        v_titulo,
        v_descripcion,
        jsonb_build_object(
            'grupo_id', v_grupo.id,
            'grupo_nombre', v_grupo.nombre,
            'evento_id', new.id,
            'evento_nombre', new.nombre,
            'estado', new.estado
        )
    from public.usuario_grupo ug
    where ug.id_grupo = new.id_grupo
      and ug.id_usuario is distinct from v_actor
    on conflict do nothing;

    return new;
end;
$$;

create or replace function public.procesar_recordatorios_juntada()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_inserted integer;
begin
    insert into public.notificacion (
        destinatario_id,
        id_grupo,
        id_evento,
        tipo,
        titulo,
        descripcion,
        payload,
        recordatorio_dias_antes
    )
    select distinct
        ue.id_usuario,
        e.id_grupo,
        e.id,
        'recordatorio_juntada',
        case reminder.dias
            when 0 then 'Juntada hoy'
            when 2 then 'Juntada en 2 días'
            when 4 then 'Juntada en 4 días'
        end,
        'Recordatorio: ' || e.nombre || '.',
        jsonb_build_object(
            'grupo_id', e.id_grupo,
            'evento_id', e.id,
            'evento_nombre', e.nombre,
            'fecha_hora_inicio', e.fecha_hora_inicio,
            'dias_antes', reminder.dias
        ),
        reminder.dias
    from public.evento e
    join public.usuario_evento ue
      on ue.id_evento = e.id
     and ue.asistencia = 'voy'
    cross join (values (0::smallint), (2::smallint), (4::smallint)) as reminder(dias)
    where e.estado = 'confirmado'
      and e.fecha_hora_inicio is not null
      and (e.fecha_hora_inicio at time zone 'UTC')::date
          - (now() at time zone 'UTC')::date = reminder.dias
    on conflict (destinatario_id, id_evento, recordatorio_dias_antes)
      where tipo = 'recordatorio_juntada' and id_evento is not null
      do nothing;

    get diagnostics v_inserted = row_count;
    return v_inserted;
end;
$$;

revoke all on function public.procesar_recordatorios_juntada() from public, anon, authenticated;
grant execute on function public.procesar_recordatorios_juntada() to service_role;

create trigger trg_usuario_grupo_incorporacion
after insert on public.usuario_grupo
for each row
execute function public.genera_notificacion_grupo_agregado();

create trigger trg_opcion_propuesta_creada
after insert on public.opcion_encuesta
referencing new table as inserted_options
for each statement
execute function public.genera_notificacion_propuesta_creada();

create trigger trg_encuesta_votacion_cerrada
after update of activa on public.encuesta
for each row
when (old.activa is true and new.activa is false)
execute function public.genera_notificacion_cierre_votacion();

create trigger trg_evento_cambios_notificacion
after insert on public.evento
for each row
when (new.estado = 'confirmado')
execute function public.genera_notificacion_evento();

create trigger trg_evento_estado_notificacion
after update of estado on public.evento
for each row
when (
    old.estado is distinct from new.estado
    and new.estado in ('confirmado', 'cancelado')
)
execute function public.genera_notificacion_evento();

create policy "select_own_notifications" on public.notificacion
for select
using (auth.uid() = destinatario_id);

create policy "deny_insert_notifications" on public.notificacion
for insert
with check (false);

create policy "update_own_notifications" on public.notificacion
for update
using (auth.uid() = destinatario_id)
with check (auth.uid() = destinatario_id and leida_en is not null);

create policy "deny_delete_notifications" on public.notificacion
for delete
using (false);

create policy "select_own_device_tokens" on public.dispositivo_push
for select
using (auth.uid() = id_usuario);

create policy "insert_own_device_tokens" on public.dispositivo_push
for insert
with check (auth.uid() = id_usuario);

create policy "update_own_device_tokens" on public.dispositivo_push
for update
using (auth.uid() = id_usuario)
with check (auth.uid() = id_usuario);

create policy "delete_own_device_tokens" on public.dispositivo_push
for delete
using (auth.uid() = id_usuario);

do $$
begin
    if exists (
        select 1
        from pg_publication p
        where p.pubname = 'supabase_realtime'
    ) and not exists (
        select 1
        from pg_publication_tables pt
        where pt.pubname = 'supabase_realtime'
          and pt.schemaname = 'public'
          and pt.tablename = 'notificacion'
    ) then
        alter publication supabase_realtime add table public.notificacion;
    end if;
end $$;
