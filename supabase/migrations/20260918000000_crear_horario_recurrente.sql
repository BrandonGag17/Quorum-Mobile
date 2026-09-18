create or replace function public.crear_horario_recurrente(
    p_titulo text, p_hora_inicio time, p_hora_fin time,
    p_fecha_inicio date, p_dias integer[]
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_horario public.horario_recurrente%rowtype;
    v_dias jsonb;
begin
    if auth.uid() is null then
        raise exception 'No hay un usuario autenticado';
    end if;
    if p_titulo is null or btrim(p_titulo) = '' or p_fecha_inicio is null or
       p_hora_inicio is null or p_hora_fin is null or
       p_hora_inicio >= time '24:00:00' or p_hora_fin >= time '24:00:00' or
       p_hora_fin <= p_hora_inicio then
        raise exception 'Datos del horario invalidos';
    end if;
    if coalesce(cardinality(p_dias), 0) = 0 or exists (
        select 1 from unnest(p_dias) as d(dia)
        where dia is null or dia < 1 or dia > 7
    ) then
        raise exception 'Dias de repeticion invalidos';
    end if;
    insert into public.horario_recurrente (
        id_usuario, titulo, hora_inicio, hora_fin,
        fecha_inicio, fecha_fin, frecuencia, origen
    ) values (
        auth.uid(), btrim(p_titulo), p_hora_inicio, p_hora_fin,
        p_fecha_inicio, null, 'semanal', 'manual'
    ) returning * into v_horario;

    with insertados as (
        insert into public.dia_horario_recurrente (id_horario_recurrente, dia_semana)
        select v_horario.id_horario_recurrente, d.dia
        from (select distinct unnest(p_dias) as dia) d
        returning *
    )
    select jsonb_agg(to_jsonb(i)) into v_dias from insertados i;

    return jsonb_build_object('horario', to_jsonb(v_horario), 'dias', v_dias);
end;
$$;
revoke all on function public.crear_horario_recurrente(text, time, time, date, integer[]) from public;
grant execute on function public.crear_horario_recurrente(text, time, time, date, integer[]) to authenticated;
