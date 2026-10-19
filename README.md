# Reportabilidad Diaria de Trabajadores

App web (HTML + CSS + JS) que funciona **sin servidor y sin Supabase**: los datos se guardan
en el navegador del equipo y el acceso está protegido con una clave.

## Archivos
- `index.html` — estructura
- `styles.css` — estilos (tema claro corporativo, responsive)
- `app.js` — lógica (login, trabajadores, registros, PDF, correo, respaldo)
- `sha256.js` — hash de respaldo para abrir la app sin HTTPS (doble clic en index.html)
- `animations.js` — animaciones sutiles (GSAP)
- `server.js` — servidor Node opcional (solo para el envío de correo)

## Clave de acceso
- Clave inicial: **`1234`**.
- La clave se guarda como hash SHA-256 en el navegador: no queda en texto plano.
- Para cambiarla: botón **🔑 Cambiar clave** dentro de la app.
- Si la olvidaste: en la pantalla de acceso usa **"🔑 ¿Olvidaste la clave? Restablecer a 1234"**
  (no borra los datos).

## Dónde viven los datos
- En el **navegador** de cada equipo (localStorage). No hay nube: cada computador tiene su propia copia.
- Por eso: usa **💾 Exportar datos** para bajar un respaldo `.json` y **📂 Importar datos** para
  restaurarlo o pasarlo a otro equipo. Conviene exportar al cierre de cada jornada.
- Si se borra el historial del navegador o se usa otro equipo, se pierden los datos que no estén respaldados.

## Exportar / importar (respaldo)
- **💾 Exportar datos** → descarga `reportabilidad-AAAA-MM-DD.json` con todos los trabajadores y registros.
- **📂 Importar datos** → elige un `.json` y reemplaza los datos actuales (pregunta antes de hacerlo).

## Despliegue en Netlify (opcional)
La app funciona abriéndola como archivo local o servida con Node; Netlify solo sirve para tener
una URL fija y HTTPS.
1. Entra a https://app.netlify.com y crea cuenta (gratis).
2. Arrastra esta carpeta completa al recuadro "Drag and drop your site folder".
3. Netlify te genera una URL tipo `https://nombre-aleatorio.netlify.app`.
4. (Opcional) En "Site settings > Change site name" puedes personalizar la URL.

## Ejecutar con Node.js (recomendado para el correo)
```bash
npm install
copy .env.example .env   # completa tus credenciales
npm run dev             # nodemon (reinicia solo al guardar cambios)
```
Abre http://localhost:3000

## Envío de correo
- Con el servidor Node o Netlify Functions: correo real vía Nodemailer (Gmail).
- Variables de entorno (en `.env` local o en Netlify → Site settings → Environment variables):
  - `EMAIL_USER` = tu correo Gmail
  - `EMAIL_PASS` = contraseña de aplicación de Gmail (Google Account → Seguridad → Contraseñas de aplicaciones)
  - `EMAIL_SERVICE` = proveedor: `gmail`, `outlook`, `yahoo`, etc. (opcional, por defecto gmail)
- `netlify/functions/send-email.js` es la función equivalente para Netlify.
- Si no hay servidor (archivo abierto con doble clic), la app usa `mailto:` y abre tu programa de correo.

## Consideraciones de protección de datos
- La clave de acceso se almacena como hash SHA-256, nunca en texto plano.
- Los datos quedan en el equipo (navegador). El acceso de otra persona al equipo implica acceso a los datos.
- Para uso compartido entre varias personas o equipos, conviene usar un servidor con base de datos
  (por ejemplo, volver a Supabase con Supabase Auth) en lugar de archivos locales.
- No compartas la clave con terceros y guarda los respaldos `.json` en un lugar seguro.
