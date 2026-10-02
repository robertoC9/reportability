const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }
  try {
    const { destinatario, asunto, registros } = JSON.parse(event.body);
    if (!destinatario || !registros?.length) {
      return { statusCode: 400, body: 'Faltan datos (destinatario o registros)' };
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // gmail, outlook, yahoo, etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const lineas = registros.map(r =>
      `RUT: ${r.rut} | Nombre: ${r.nombre} | Fecha: ${r.fecha} | Rol: ${r.rol} | Especialidad: ${r.especialidad || '-'} | Actividad: ${r.actividad} | N° Planos: ${r.planos ?? 0}`
    ).join('\n');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: destinatario,
      subject: asunto || 'Reportabilidad diaria de trabajadores',
      text: 'Estimado,\n\nDetalle de trabajadores:\n\n' + lineas + '\n\nSaludos cordiales.',
    });

    return { statusCode: 200, body: 'Correo enviado ✅' };
  } catch (err) {
    return { statusCode: 500, body: 'Error: ' + err.message };
  }
};
