# Reportabilidad Diaria de Trabajadores

App web estática (HTML + CSS + JS) lista para desplegar en Netlify.

## Archivos
- `index.html` — estructura
- `styles.css` — estilos (tema claro corporativo, responsive)
- `app.js` — lógica (login, trabajadores, registros, PDF, correo)
- `config.js` — URL y clave de API de Supabase (edítalas aquí para todo el equipo)
- `sha256.js` — respaldo de hash para cuando se abre el archivo sin HTTPS
- `animations.js` — animaciones sutiles (GSAP)
- `supabase_setup.sql` — creación de tablas, clave inicial y políticas RLS

## Acceso y clave de acceso
- La clave **no se guarda en texto plano**: en la base de datos solo queda su hash SHA-256.
  Quien lea la tabla `clave_app` no puede deducir la clave.
- Clave inicial: `1234` (créala al ejecutar `supabase_setup.sql`).
- Para cambiarla: botón **🔑 Cambiar clave** dentro de la app.
- Si la olvidaste, ejecuta en Supabase → SQL Editor:
  ```sql
  update clave_app set clave = encode(extensions.digest('1234','sha256'),'hex') where id = 1;
  ```
  (y vuelve a entrar con `1234`).

## Configuración de Supabase (si no puedes entrar)
La app te avisa exactamente qué falta. Para cambiar los datos de conexión hay dos formas:

1. **Desde la app** (más rápido): en la pantalla de acceso abre **⚙️ Configuración**,
   pega la URL del proyecto y la clave de API y presiona *Probar conexión* → *Guardar*.
   Queda guardado en ese navegador.
2. **Para todo el equipo**: edita `config.js` y vuelve a subir la carpeta a Netlify.

Dónde copiar los datos: Supabase → **Project Settings → API**
- URL: `https://<tu-ref>.supabase.co`
- Clave: la que dice `sb_publishable_...` (o la antigua `anon` pública)

## Solución de problemas
| Mensaje en pantalla | Causa | Solución |
|---|---|---|
| *No se pudo conectar con Supabase* | URL de proyecto inexistente/incorrecta o proyecto borrado | Pega la URL real en ⚙️ Configuración o en `config.js` |
| *Faltan las tablas en Supabase* | Nunca se ejecutó el SQL | Ejecuta `supabase_setup.sql` completo |
| *Permisos bloqueados por RLS* | Faltan las políticas de `clave_app` | Ejecuta la sección de políticas de `supabase_setup.sql` |
| *La clave de API no es válida* | Se rotó la clave de API | Copia la nueva desde Project Settings → API |
| *No hay ninguna clave configurada* | La tabla `clave_app` está vacía | Ejecuta `supabase_setup.sql` (inserta la clave inicial) |
| *Clave incorrecta* | La clave escrita no es la correcta | Usa el botón 🔑 Cambiar clave o el `update` de arriba para resetear |

> Si el proyecto de Supabase fue borrado o pausado, no hay forma de recuperar los datos
> desde la app: crea un proyecto nuevo, ejecuta `supabase_setup.sql` y actualiza `config.js`.

## Despliegue en Netlify
1. Entra a https://app.netlify.com y crea cuenta (gratis).
2. En el panel, arrastra esta carpeta completa al recuadro "Drag and drop your site folder".
3. Netlify te genera una URL tipo `https://nombre-aleatorio.netlify.app`.
4. (Opcional) En "Site settings > Change site name" puedes personalizar la URL.

## Notas
- Los datos se guardan en **Supabase** (nube), por lo que se comparten entre PC y móvil.
- La clave de acceso se guarda hasheada en la tabla `clave_app`. El SQL inicial está en `supabase_setup.sql`.
- No se usa `localStorage` para los datos: todo persiste en la nube
  (en el navegador solo se guarda la URL/clave de conexión y la sesión iniciada).

## Ejecutar con Node.js
```bash
npm install
copy .env.example .env   # completa tus credenciales
npm run dev             # nodemon (reinicia solo al guardar cambios)
```
Abre http://localhost:3000

## Middleware (Netlify Functions)
- `netlify/functions/send-email.js`: envía correos reales vía Nodemailer (Gmail).
- Configura en Netlify → Site settings → Environment variables:
  - `EMAIL_USER` = tu correo Gmail
  - `EMAIL_PASS` = contraseña de aplicación de Gmail (Google Account → Seguridad → Contraseñas de aplicaciones)
  - `EMAIL_SERVICE` = proveedor: `gmail`, `outlook`, `yahoo`, etc. (opcional, por defecto gmail)

## Protección de datos
- HTTPS obligatorio (Netlify lo provee automáticamente): los datos viajan cifrados.
- Row Level Security (RLS) activado en todas las tablas.
- La clave de acceso se almacena como hash SHA-256, nunca en texto plano.
- Para mayor seguridad a futuro, considera migrar a Supabase Auth (usuarios individuales con JWT),
  que además permitiría tener una clave propia por persona y auditar entradas.
