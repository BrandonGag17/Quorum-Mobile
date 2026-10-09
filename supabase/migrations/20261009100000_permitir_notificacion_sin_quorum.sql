alter table public.notificacion
    drop constraint if exists notificacion_tipo_check;

alter table public.notificacion
    add constraint notificacion_tipo_check check (
        tipo in (
            'grupo_agregado',
            'propuesta_creada',
            'evento_creado',
            'sugerencia_fecha_hora',
            'votacion_cerrada',
            'recordatorio_juntada',
            'juntada_cancelada',
            'propuesta_sin_quorum'
        )
    );
