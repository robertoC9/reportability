-- ============ SQL PARA SUPABASE (v2) ============
-- Ejecuta esto en: SQL Editor → New query → Run
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.

create extension if not exists pgcrypto with schema extensions;

-- ============ TABLAS ============
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

-- ============ CLAVE DE ACCESO ============
-- La clave se guarda como hash SHA-256, nunca en texto plano.
-- Clave inicial: 1234  (cámbiala con el botón "🔑 Cambiar clave" de la app)
insert into clave_app (id, clave)
values (1, encode(extensions.digest('1234', 'sha256'), 'hex'))
on conflict (id) do nothing;

-- Si OLVIDASTE la clave, descomenta y ejecuta esta línea (la vuelve a poner en 1234):
-- update clave_app set clave = encode(extensions.digest('1234','sha256'),'hex') where id = 1;

-- ============ SEGURIDAD (RLS) ============
alter table trabajadores enable row level security;
alter table registros enable row level security;
alter table clave_app enable row level security;

-- Datos de la app
drop policy if exists "acceso_total_trab" on trabajadores;
create policy "acceso_total_trab" on trabajadores for all using (true) with check (true);

drop policy if exists "acceso_total_reg" on registros;
create policy "acceso_total_reg" on registros for all using (true) with check (true);

-- Clave: lectura (para verificar el hash al entrar)
drop policy if exists "lectura_clave" on clave_app;
create policy "lectura_clave" on clave_app for select using (true);

-- Clave: escritura (para que el botón "Cambiar clave" funcione)
drop policy if exists "escritura_clave" on clave_app;
create policy "escritura_clave" on clave_app for insert with check (true);

drop policy if exists "actualizar_clave" on clave_app;
create policy "actualizar_clave" on clave_app for update using (true) with check (true);

-- ============ VERIFICACIÓN ============
-- Debe devolver 1 fila con un hash de 64 caracteres:
select id, length(clave) as largo_clave from clave_app;
