-- Crear tabla para las reseñas de juntadas
create table public.resena_juntada (
  id uuid primary key default gen_random_uuid(),
  id_usuario uuid not null references auth.users(id) on delete cascade,
  id_evento uuid not null references public.evento(id) on delete cascade,
  calificacion smallint not null check (calificacion >= 1 and calificacion <= 5),
  comentario text,
  creada_en timestamp with time zone default now(),
  actualizada_en timestamp with time zone default now(),
  unique(id_usuario, id_evento)
);

-- Crear índice para búsquedas rápidas
create index idx_resena_juntada_usuario on public.resena_juntada(id_usuario);
create index idx_resena_juntada_evento on public.resena_juntada(id_evento);
create index idx_resena_juntada_creada on public.resena_juntada(creada_en);

-- Habilitar RLS
alter table public.resena_juntada enable row level security;

-- Política: Los usuarios solo ven sus propias reseñas
create policy "select_own_reviews" on public.resena_juntada for select
  using (auth.uid() = id_usuario);

-- Política: Los usuarios solo pueden insertar sus propias reseñas
create policy "insert_own_reviews" on public.resena_juntada for insert
  with check (auth.uid() = id_usuario);

-- Política: Los usuarios solo pueden actualizar sus propias reseñas
create policy "update_own_reviews" on public.resena_juntada for update
  using (auth.uid() = id_usuario)
  with check (auth.uid() = id_usuario);

-- Política: Los usuarios solo pueden eliminar sus propias reseñas
create policy "delete_own_reviews" on public.resena_juntada for delete
  using (auth.uid() = id_usuario);
