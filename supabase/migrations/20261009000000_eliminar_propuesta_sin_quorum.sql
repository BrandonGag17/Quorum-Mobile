create or replace function public.eliminar_propuesta_sin_quorum(
    p_evento_id uuid,
    p_encuesta_id uuid
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_usuario_id uuid := auth.uid();
    v_evento public.evento%rowtype;
    v_encuesta public.encuesta%rowtype;
    v_integrantes integer;
    v_confirmados integer;
begin
    if v_usuario_id is null then
        raise exception 'Se requiere iniciar sesión para finalizar la propuesta';
    end if;

    select * into v_evento
    from public.evento
    where id = p_evento_id
      and estado = 'planificacion'
    for update;

    if v_evento.id is null then
        return false;
    end if;

    if not exists (
        select 1 from public.usuario_grupo
        where id_grupo = v_evento.id_grupo
          and id_usuario = v_usuario_id
    ) then
        raise exception 'No pertenecés al grupo de esta propuesta';
    end if;

    select * into v_encuesta
    from public.encuesta
    where id = p_encuesta_id
      and id_evento = p_evento_id
      and activa is true
      and cierre_en <= now()
    for update;

    if v_encuesta.id is null then
        return false;
    end if;

    select count(*) into v_integrantes
    from public.usuario_grupo
    where id_grupo = v_evento.id_grupo;

    select count(distinct id_usuario) into v_confirmados
    from public.usuario_evento
    where id_evento = p_evento_id
      and asistencia = 'voy';

    if ceil(v_integrantes::numeric / 2) <= v_confirmados then
        return false;
    end if;

    -- Estas notificaciones no guardan referencias al evento/encuesta, que se borran abajo.
    insert into public.notificacion (
        destinatario_id,
        id_grupo,
        tipo,
        titulo,
        descripcion,
        payload
    )
    select
        ug.id_usuario,
        v_evento.id_grupo,
        'propuesta_sin_quorum',
        'Votación finalizada sin quórum',
        'La propuesta ' || v_evento.nombre || ' finalizó su votación, pero no alcanzó el quórum. La propuesta fue eliminada.',
        jsonb_build_object(
            'grupo_nombre', g.nombre,
            'evento_nombre', v_evento.nombre
        )
    from public.usuario_grupo ug
    join public.grupo g on g.id = ug.id_grupo
    where ug.id_grupo = v_evento.id_grupo;

    -- Borrar dependencias antes del evento para no depender de reglas CASCADE implícitas.
    delete from public.foto where id_evento = p_evento_id;
    delete from public.gasto where id_evento = p_evento_id;
    delete from public.usuario_evento where id_evento = p_evento_id;
    delete from public.voto
    where id_opcion in (
        select id from public.opcion_encuesta where id_encuesta = p_encuesta_id
    );
    delete from public.opcion_encuesta where id_encuesta = p_encuesta_id;
    delete from public.encuesta where id = p_encuesta_id;
    delete from public.evento where id = p_evento_id;

    return true;
end;
$$;

revoke all on function public.eliminar_propuesta_sin_quorum(uuid, uuid) from public, anon;
grant execute on function public.eliminar_propuesta_sin_quorum(uuid, uuid) to authenticated;
