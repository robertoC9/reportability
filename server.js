const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint para enviar correo
app.post('/api/send-email', async (req, res) => {
  try {
    const { destinatario, asunto, registros } = req.body;
    if (!destinatario || !registros?.length) return res.status(400).send('Faltan datos');

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const lineas = registros.map(r =>
      `RUT: ${r.rut} | Nombre: ${r.nombre} | Fecha: ${r.fecha} | Rol: ${r.rol} | Especialidad: ${r.especialidad || '-'} | Actividad: ${r.actividad} | N° Planos: ${r.planos ?? 0}`
    ).join('\n');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: destinatario,
      subject: asunto || 'Reportabilidad diaria',
      text: 'Estimado,\n\nDetalle:\n\n' + lineas + '\n\nSaludos.',
    });
    res.send('Correo enviado ✅');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
