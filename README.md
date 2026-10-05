# Reportabilidad Diaria de Trabajadores

App web estática (HTML + CSS + JS) lista para desplegar en Netlify.

## Archivos
- `index.html` — estructura
- `styles.css` — estilos (tema claro corporativo, responsive)
- `app.js` — lógica (login, trabajadores, registros, PDF, correo)
- `animations.js` — animaciones sutiles (GSAP)

## Despliegue en Netlify
1. Entra a https://app.netlify.com y crea cuenta (gratis).
2. En el panel, arrastra esta carpeta completa al recuadro "Drag and drop your site folder".
3. Netlify te genera una URL tipo `https://nombre-aleatorio.netlify.app`.
4. (Opcional) En "Site settings > Change site name" puedes personalizar la URL.

## Notas
- Los datos se guardan en **Supabase** (nube), por lo que se comparten entre PC y móvil.
- La clave de acceso se guarda en la tabla `clave_app`. El SQL inicial está en `supabase_setup.sql`.
- No se usa `localStorage`: todo persiste en la nube.

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
- Acceso restringido por clave compartida; no la publiques.
- Para mayor seguridad a futuro, considera migrar a Supabase Auth (usuarios individuales con JWT).
