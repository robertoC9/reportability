const SUPABASE_URL = 'https://scndyoaynnagghydnjfp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Sp-E0KQuxWFgo7RKhhuGgQ_R2pnfSmj';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let trabajadores = [];
let registros = [];

// Reloj en tiempo real
function actualizarReloj() {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hora = ahora.toLocaleTimeString('es-CL');
  document.getElementById('reloj').textContent = `📅 ${fecha} — 🕐 ${hora}`;
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

const tbodyTrab = document.getElementById('tbodyTrabajadores');
const tbody = document.getElementById('tbody');
const filtroFecha = document.getElementById('filtroFecha');
const checkAll = document.getElementById('checkAll');

function hoy() { return new Date().toISOString().slice(0, 10); }
function formatearFecha(f) { const [a, m, d] = f.split('-'); return `${d}/${m}/${a}`; }

// ============ LOGIN ============
async function entrar() {
  const { data, error } = await sb.from('clave_app').select('clave').eq('id', 1).single();
  if (error) return alert('Error conectando con el servidor: ' + error.message);
  const clave = document.getElementById('inputClave').value;
  if (clave === data.clave) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    sessionStorage.setItem('acceso', 'ok');
    cargarDatos();
  } else {
    document.getElementById('errorClave').textContent = 'Clave incorrecta';
  }
}
document.getElementById('btnEntrar').addEventListener('click', entrar);
document.getElementById('inputClave').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
if (sessionStorage.getItem('acceso') === 'ok') {
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  cargarDatos();
}

// ============ CAMBIO DE CLAVE ============
window.cambiarClave = async () => {
  const nueva = prompt('Nueva clave de acceso:');
  if (!nueva) return;
  const confirmacion = prompt('Confirma la nueva clave:');
  if (nueva !== confirmacion) return alert('Las claves no coinciden.');
  const { error } = await sb.from('clave_app').update({ clave: nueva }).eq('id', 1);
  alert(error ? 'Error: ' + error.message : 'Clave actualizada correctamente ✅');
};

// ============ DATOS ============
async function cargarDatos() {
  const [{ data: t }, { data: r }] = await Promise.all([
    sb.from('trabajadores').select('*').order('id'),
    sb.from('registros').select('*').order('fecha', { ascending: false }),
  ]);
  trabajadores = t || [];
  registros = r || [];
  renderTrabajadores();
  renderRegistros();
}

function renderTrabajadores() {
  tbodyTrab.innerHTML = '';
  trabajadores.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.rut}</td>
      <td>${t.nombre}</td>
      <td>${t.rol}</td>
      <td>${t.especialidad || '-'}</td>
      <td><input type="date" class="inp-fecha" data-id="${t.id}" value="${hoy()}"></td>
      <td><input type="text" class="inp-actividad edit-actividad" data-id="${t.id}" placeholder="Actividad del día"></td>
      <td><input type="number" class="inp-planos" data-id="${t.id}" min="0" placeholder="0"></td>
      <td><button class="btn-guardar" data-id="${t.id}">💾 Guardar registro</button></td>
      <td><button class="btn-eliminar" data-id="${t.id}">Eliminar</button></td>`;
    tbodyTrab.appendChild(tr);
  });
  document.getElementById('vacioTrab').style.display = trabajadores.length ? 'none' : 'block';
}

function renderRegistros() {
  const filtro = filtroFecha.value;
  tbody.innerHTML = '';
  const visibles = registros.filter(r => !filtro || r.fecha === filtro);
  visibles.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="check-item" data-id="${r.id}"></td>
      <td>${r.rut}</td>
      <td>${r.nombre}</td>
      <td>${formatearFecha(r.fecha)}</td>
      <td>${r.rol}</td>
      <td>${r.especialidad || '-'}</td>
      <td>${r.actividad}</td>
      <td>${r.planos ?? 0}</td>
      <td><button class="btn-eliminar" data-id="${r.id}">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('mensajeVacio').style.display = visibles.length ? 'none' : 'block';
  checkAll.checked = false;
}

document.getElementById('formTrabajador').addEventListener('submit', async e => {
  e.preventDefault();
  const nuevo = {
    rut: document.getElementById('rut').value.trim(),
    nombre: document.getElementById('nombre').value.trim(),
    rol: document.getElementById('rol').value.trim(),
    especialidad: document.getElementById('especialidad').value.trim(),
  };
  const { data, error } = await sb.from('trabajadores').insert(nuevo).select().single();
  if (error) return alert('Error: ' + error.message);
  trabajadores.push(data);
  e.target.reset();
  renderTrabajadores();
});

tbodyTrab.addEventListener('click', async e => {
  const id = Number(e.target.dataset.id);
  if (e.target.classList.contains('btn-eliminar')) {
    if (confirm('¿Eliminar este trabajador?\n\nSu historial de registros diarios se conservará.')) {
      await sb.from('trabajadores').delete().eq('id', id);
      trabajadores = trabajadores.filter(t => t.id !== id);
      renderTrabajadores();
    }
  }
  if (e.target.classList.contains('btn-guardar')) {
    const t = trabajadores.find(x => x.id === id);
    const fila = e.target.closest('tr');
    const fecha = fila.querySelector('.inp-fecha').value;
    const actividad = fila.querySelector('.inp-actividad').value.trim();
    const planos = fila.querySelector('.inp-planos').value || 0;
    if (!fecha || !actividad) return alert('Ingresa fecha y actividad.');
    const nuevo = { rut: t.rut, nombre: t.nombre, fecha, rol: t.rol, especialidad: t.especialidad || '', actividad, planos: Number(planos) };
    const { data, error } = await sb.from('registros').insert(nuevo).select().single();
    if (error) return alert('Error: ' + error.message);
    registros.unshift(data);
    fila.querySelector('.inp-actividad').value = '';
    fila.querySelector('.inp-planos').value = '';
    renderRegistros();
    alert(`Registro guardado: ${t.nombre} — ${formatearFecha(fecha)}`);
  }
});

tbody.addEventListener('click', async e => {
  if (e.target.classList.contains('btn-eliminar')) {
    const id = Number(e.target.dataset.id);
    await sb.from('registros').delete().eq('id', id);
    registros = registros.filter(r => r.id !== id);
    renderRegistros();
  }
});

checkAll.addEventListener('change', () => {
  document.querySelectorAll('.check-item').forEach(c => c.checked = checkAll.checked);
});
filtroFecha.addEventListener('change', renderRegistros);
document.getElementById('btnLimpiarFiltro').addEventListener('click', () => { filtroFecha.value = ''; renderRegistros(); });
document.getElementById('btnClave').addEventListener('click', window.cambiarClave);

function seleccionados() {
  const ids = [...document.querySelectorAll('.check-item:checked')].map(c => Number(c.dataset.id));
  return registros.filter(r => ids.includes(r.id));
}

document.getElementById('btnPDF').addEventListener('click', () => {
  const datos = seleccionados();
  const filas = (datos.length ? datos : registros).map(r => [r.rut, r.nombre, formatearFecha(r.fecha), r.rol, r.especialidad || '-', r.actividad, r.planos ?? 0]);
  if (!filas.length) return alert('No hay registros para exportar.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reportabilidad Diaria de Trabajadores', 14, 15);
  doc.autoTable({ head: [['RUT', 'Nombre', 'Fecha', 'Rol', 'Especialidad', 'Actividad', 'N° Planos']], body: filas, startY: 25, styles: { fontSize: 8 }, headStyles: { fillColor: [30, 58, 95] } });
  doc.save('reportabilidad.pdf');
});

document.getElementById('btnCorreo').addEventListener('click', async () => {
  const datos = seleccionados();
  if (!datos.length) return alert('Selecciona al menos un registro.');
  const destinatario = prompt('Correo del destinatario:');
  if (!destinatario) return;

  // Intentar servidor Node.js; si falla (archivo local), usar mailto
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatario, asunto: 'Reportabilidad diaria de trabajadores', registros: datos.map(r => ({ ...r, fecha: formatearFecha(r.fecha) })) }),
    });
    if (res.ok) { alert(await res.text()); return; }
    throw new Error();
  } catch {
    const lineas = datos.map(r => `RUT: ${r.rut} | Nombre: ${r.nombre} | Fecha: ${formatearFecha(r.fecha)} | Rol: ${r.rol} | Especialidad: ${r.especialidad || '-'} | Actividad: ${r.actividad} | N° Planos: ${r.planos ?? 0}`).join('\n');
    window.location.href = `mailto:${destinatario}?subject=${encodeURIComponent('Reportabilidad diaria')}&body=${encodeURIComponent(lineas)}`;
  }
});
