-- ============ SQL PARA SUPABASE ============
-- Ejecuta esto en: SQL Editor → New query → Run

create table if not exists trabajadores (
  id bigint primary key generated always as identity,
  rut text, nombre text, rol text, especialidad text
);

create table if not exists registros (
  id bigint primary key generated always as identity,
  rut text, nombre text, fecha date, rol text, especialidad text, actividad text, planos int default 0
);

create table if not exists clave_app (
  id int primary key,
  clave text
);

insert into clave_app (id, clave) values (1, '1234')
on conflict (id) do nothing;

-- Permisos para la clave pública (anon)
alter table trabajadores enable row level security;
alter table registros enable row level security;
alter table clave_app enable row level security;

create policy "acceso_total_trab" on trabajadores for all using (true) with check (true);
create policy "acceso_total_reg" on registros for all using (true) with check (true);
create policy "lectura_clave" on clave_app for select using (true);
