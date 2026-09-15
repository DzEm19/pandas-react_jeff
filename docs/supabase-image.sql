-- Ejecuta este script en Supabase > SQL Editor.
create table if not exists public.face_records (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    first_name text not null,
    last_name text not null,
    age integer not null check (age between 0 and 150),
    dni text not null,
    phone text not null,
    label text not null,
    image_url text not null,
    image_path text not null,
    created_at timestamptz not null default now()
);

-- Ejecuta también estas líneas si la tabla ya existía con el esquema anterior.
alter table public.face_records drop constraint if exists face_records_label_key;
alter table public.face_records add column if not exists first_name text;
alter table public.face_records add column if not exists last_name text;
alter table public.face_records add column if not exists age integer;
alter table public.face_records add column if not exists dni text;
alter table public.face_records add column if not exists phone text;

alter table public.face_records enable row level security;

create policy "Permitir consultar registros faciales"
    on public.face_records for select
    to anon, authenticated
    using (true);

create policy "Permitir registrar rostros"
    on public.face_records for insert
    to anon, authenticated
    with check (true);

insert into storage.buckets (id, name, public)
values ('face-images', 'face-images', true)
on conflict (id) do update set public = true;

create policy "Permitir subir imágenes faciales"
    on storage.objects for insert
    to anon, authenticated
    with check (bucket_id = 'face-images');

create policy "Permitir ver imágenes faciales"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'face-images');