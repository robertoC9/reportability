// ============ APP LOCAL (sin Supabase) ============
// Los datos se guardan en este navegador (localStorage) y la clave de acceso se
// valida localmente con hash SHA-256.
// Para respaldo: botón "💾 Exportar datos" (JSON) y "📂 Importar datos".

const CLAVE_DATOS = 'reportabilidad.datos';
const CLAVE_ACCESO = 'reportabilidad.clave';
const CLAVE_INICIAL = '1234';

let trabajadores = [];
let registros = [];

// ============ ALMACENAMIENTO ============
function leerDatos() {
  try {
    const raw = localStorage.getItem(CLAVE_DATOS);
    if (!raw) return { trabajadores: [], registros: [] };
    const d = JSON.parse(raw);
    return {
      trabajadores: Array.isArray(d.trabajadores) ? d.trabajadores : [],
      registros: Array.isArray(d.registros) ? d.registros : [],
    };
  } catch {
    return { trabajadores: [], registros: [] };
  }
}

function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify({ trabajadores, registros }));
    return true;
  } catch {
    alert('No se pudo guardar en este navegador (almacenamiento lleno o bloqueado).\n\nUsa "💾 Exportar datos" para bajar una copia de seguridad.');
    return false;
  }
}

function nuevoId(lista) {
  return lista.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;
}

// ============ CLAVE DE ACCESO (hash SHA-256) ============
const PUEDE_HASHEAR = !!(window.crypto && window.crypto.subtle);
async function hashTexto(texto) {
  if (PUEDE_HASHEAR) {
    const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  if (typeof window.sha256Respaldo === 'function') return window.sha256Respaldo(texto);
  return null;
}
function pareceHash(valor) {
  return typeof valor === 'string' && /^[0-9a-f]{64}$/i.test(valor.trim());
}
function claveAlmacenada() {
  let v = localStorage.getItem(CLAVE_ACCESO);
  if (!v) {
    localStorage.setItem(CLAVE_ACCESO, CLAVE_INICIAL);
    v = CLAVE_INICIAL;
  }
  return v;
}
function esClaveInicial() {
  const v = localStorage.getItem(CLAVE_ACCESO);
  return !v || v === CLAVE_INICIAL;
}
// Acepta hash (formato actual) y texto plano (formato antiguo) para no perder acceso.
async function claveCoincide(ingresada, guardada) {
  if (!guardada) return false;
  const a = String(ingresada).trim();
  const g = String(guardada).trim();
  if (!a || !g) return false;
  if (g.toLowerCase() === a.toLowerCase()) return true;
  if (pareceHash(g)) {
    const h = await hashTexto(a);
    return !!h && h.toLowerCase() === g.toLowerCase();
  }
  return false;
}

// ============ UTILIDADES DE PANTALLA ============
const el = id => document.getElementById(id);
function escaparHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function mostrarErrorLogin(titulo, detalle) {
  el('errorClave').textContent = titulo;
  el('detalleClave').textContent = detalle || '';
}
function limpiarErrorLogin() {
  el('errorClave').textContent = '';
  el('detalleClave').textContent = '';
}
function mostrarApp() {
  el('login').style.display = 'none';
  el('app').style.display = 'block';
}
function mostrarLogin() {
  el('app').style.display = 'none';
  el('login').style.display = 'flex';
}
function avisoEnApp(titulo, detalle) {
  const box = el('avisoApp');
  box.innerHTML = `<strong>${escaparHTML(titulo)}</strong>${detalle ? `<br>${escaparHTML(detalle)}` : ''}<button id="cerrarAviso" title="Cerrar">✕</button>`;
  box.style.display = 'block';
  el('cerrarAviso').addEventListener('click', () => { box.style.display = 'none'; });
}

// ============ RELOJ ============
function actualizarReloj() {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hora = ahora.toLocaleTimeString('es-CL');
  el('reloj').textContent = `📅 ${fecha} — 🕐 ${hora}`;
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

const tbodyTrab = el('tbodyTrabajadores');
const tbody = el('tbody');
const filtroFecha = el('filtroFecha');
const checkAll = el('checkAll');

function hoy() { return new Date().toISOString().slice(0, 10); }
function formatearFecha(f) { const [a, m, d] = String(f).split('-'); return `${d}/${m}/${a}`; }

// ============ LOGIN ============
async function entrar() {
  const input = el('inputClave');
  const clave = input.value.trim();
  limpiarErrorLogin();
  if (!clave) return mostrarErrorLogin('Ingresa la clave', '');

  const boton = el('btnEntrar');
  boton.disabled = true;
  boton.textContent = 'Verificando...';
  try {
    const guardada = claveAlmacenada();
    if (await claveCoincide(clave, guardada)) {
      // Si la clave estaba en texto plano, se actualiza a hash.
      if (!pareceHash(guardada)) {
        const hash = await hashTexto(guardada);
        if (hash) localStorage.setItem(CLAVE_ACCESO, hash);
      }
      input.value = '';
      sessionStorage.setItem('acceso', 'ok');
      mostrarApp();
      cargarDatos();
      pintarAvisoClaveInicial();
    } else {
      mostrarErrorLogin('Clave incorrecta', 'Verifica que esté bien escrita (distingue mayúsculas y no lleva espacios).');
    }
  } finally {
    boton.disabled = false;
    boton.textContent = 'Entrar';
  }
}
el('btnEntrar').addEventListener('click', entrar);
el('inputClave').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });

if (sessionStorage.getItem('acceso') === 'ok') {
  mostrarApp();
  cargarDatos();
  pintarAvisoClaveInicial();
}

function pintarAvisoClaveInicial() {
  const aviso = el('avisoClaveInicial');
  if (aviso) aviso.style.display = esClaveInicial() ? 'block' : 'none';
}
pintarAvisoClaveInicial();

// Permite recuperar el acceso si se olvida la clave.
el('btnRestablecerClave').addEventListener('click', () => {
  if (!confirm(`¿Restablecer la clave de acceso a "${CLAVE_INICIAL}"?\n\nSe perderá la clave actual, pero NO se borran los datos.`)) return;
  localStorage.setItem(CLAVE_ACCESO, CLAVE_INICIAL);
  pintarAvisoClaveInicial();
  mostrarErrorLogin('Clave restablecida', `Ahora puedes entrar con "${CLAVE_INICIAL}".`);
  el('inputClave').focus();
});

// ============ CAMBIO DE CLAVE ============
window.cambiarClave = async () => {
  const nueva = prompt('Nueva clave de acceso (mínimo 4 caracteres):');
  if (nueva === null) return;
  const limpia = nueva.trim();
  if (limpia.length < 4) return alert('La clave debe tener al menos 4 caracteres.');
  const confirmacion = prompt('Confirma la nueva clave:');
  if (confirmacion === null) return;
  if (limpia !== confirmacion.trim()) return alert('Las claves no coinciden.');

  const hash = await hashTexto(limpia);
  if (!hash) return alert('No se pudo cifrar la clave en este navegador. Abre la app con https:// o http://localhost.');
  localStorage.setItem(CLAVE_ACCESO, hash);
  pintarAvisoClaveInicial();
  alert('Clave actualizada ✅\n\nCierra sesión y entra con la nueva clave.');
  sessionStorage.removeItem('acceso');
  mostrarLogin();
  limpiarErrorLogin();
};

// ============ DATOS ============
function cargarDatos() {
  const d = leerDatos();
  trabajadores = d.trabajadores;
  registros = d.registros;
  renderTrabajadores();
  renderRegistros();
}

function renderTrabajadores() {
  tbodyTrab.innerHTML = '';
  trabajadores.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escaparHTML(t.rut)}</td>
      <td>${escaparHTML(t.nombre)}</td>
      <td>${escaparHTML(t.rol)}</td>
      <td>${escaparHTML(t.especialidad || '-')}</td>
      <td><input type="date" class="inp-fecha" data-id="${t.id}" value="${hoy()}"></td>
      <td><input type="text" class="inp-actividad edit-actividad" data-id="${t.id}" placeholder="Actividad del día"></td>
      <td><input type="number" class="inp-planos" data-id="${t.id}" min="0" placeholder="0"></td>
      <td><button class="btn-guardar" data-id="${t.id}">💾 Guardar registro</button></td>
      <td><button class="btn-eliminar" data-id="${t.id}">Eliminar</button></td>`;
    tbodyTrab.appendChild(tr);
  });
  el('vacioTrab').style.display = trabajadores.length ? 'none' : 'block';
}

function renderRegistros() {
  const filtro = filtroFecha.value;
  tbody.innerHTML = '';
  const visibles = registros
    .filter(r => !filtro || r.fecha === filtro)
    .slice()
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  visibles.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="check-item" data-id="${r.id}"></td>
      <td>${escaparHTML(r.rut)}</td>
      <td>${escaparHTML(r.nombre)}</td>
      <td>${escaparHTML(formatearFecha(r.fecha))}</td>
      <td>${escaparHTML(r.rol)}</td>
      <td>${escaparHTML(r.especialidad || '-')}</td>
      <td>${escaparHTML(r.actividad)}</td>
      <td>${Number(r.planos ?? 0)}</td>
      <td><button class="btn-eliminar" data-id="${r.id}">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
  el('mensajeVacio').style.display = visibles.length ? 'none' : 'block';
  checkAll.checked = false;
}

el('formTrabajador').addEventListener('submit', e => {
  e.preventDefault();
  const nuevo = {
    id: nuevoId(trabajadores),
    rut: el('rut').value.trim(),
    nombre: el('nombre').value.trim(),
    rol: el('rol').value.trim(),
    especialidad: el('especialidad').value.trim(),
  };
  if (!nuevo.rut || !nuevo.nombre || !nuevo.rol) return alert('Completa RUT, nombre y rol.');
  trabajadores.push(nuevo);
  if (!guardarDatos()) { trabajadores.pop(); return; }
  e.target.reset();
  renderTrabajadores();
});

tbodyTrab.addEventListener('click', e => {
  const id = Number(e.target.dataset.id);
  if (e.target.classList.contains('btn-eliminar')) {
    if (confirm('¿Eliminar este trabajador?\n\nSu historial de registros diarios se conservará.')) {
      trabajadores = trabajadores.filter(t => t.id !== id);
      guardarDatos();
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
    const nuevo = {
      id: nuevoId(registros),
      rut: t.rut, nombre: t.nombre, fecha, rol: t.rol,
      especialidad: t.especialidad || '', actividad, planos: Number(planos),
    };
    registros.push(nuevo);
    if (!guardarDatos()) { registros.pop(); return; }
    fila.querySelector('.inp-actividad').value = '';
    fila.querySelector('.inp-planos').value = '';
    renderRegistros();
    alert(`Registro guardado: ${t.nombre} — ${formatearFecha(fecha)}`);
  }
});

tbody.addEventListener('click', e => {
  if (e.target.classList.contains('btn-eliminar')) {
    const id = Number(e.target.dataset.id);
    if (!confirm('¿Eliminar este registro?')) return;
    registros = registros.filter(r => r.id !== id);
    guardarDatos();
    renderRegistros();
  }
});

checkAll.addEventListener('change', () => {
  document.querySelectorAll('.check-item').forEach(c => c.checked = checkAll.checked);
});
filtroFecha.addEventListener('change', renderRegistros);
el('btnLimpiarFiltro').addEventListener('click', () => { filtroFecha.value = ''; renderRegistros(); });
el('btnClave').addEventListener('click', window.cambiarClave);

function seleccionados() {
  const ids = [...document.querySelectorAll('.check-item:checked')].map(c => Number(c.dataset.id));
  return registros.filter(r => ids.includes(r.id));
}

// ============ RESPALDO (exportar / importar) ============
el('btnExportar').addEventListener('click', () => {
  const contenido = JSON.stringify({
    version: 1,
    exportado: new Date().toISOString(),
    trabajadores,
    registros,
  }, null, 2);
  const blob = new Blob([contenido], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reportabilidad-${hoy()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert(`Copia descargada ✅\n\n${trabajadores.length} trabajadores y ${registros.length} registros.`);
});

el('btnImportar').addEventListener('click', () => el('inputImportar').click());
el('inputImportar').addEventListener('change', e => {
  const archivo = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const d = JSON.parse(lector.result);
      if (!Array.isArray(d.trabajadores) || !Array.isArray(d.registros)) {
        throw new Error('el archivo no tiene el formato esperado');
      }
      if (!confirm(`Se reemplazarán los datos actuales por:\n\n- ${d.trabajadores.length} trabajadores\n- ${d.registros.length} registros\n\n¿Continuar?`)) return;
      trabajadores = d.trabajadores;
      registros = d.registros;
      guardarDatos();
      renderTrabajadores();
      renderRegistros();
      alert('Datos importados ✅');
    } catch (err) {
      alert('No se pudo importar el archivo: ' + err.message);
    }
  };
  lector.readAsText(archivo);
});

el('btnPDF').addEventListener('click', () => {
  const datos = seleccionados();
  const filas = (datos.length ? datos : registros)
    .slice()
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .map(r => [r.rut, r.nombre, formatearFecha(r.fecha), r.rol, r.especialidad || '-', r.actividad, r.planos ?? 0]);
  if (!filas.length) return alert('No hay registros para exportar.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reportabilidad Diaria de Trabajadores', 14, 15);
  doc.autoTable({ head: [['RUT', 'Nombre', 'Fecha', 'Rol', 'Especialidad', 'Actividad', 'N° Planos']], body: filas, startY: 25, styles: { fontSize: 8 }, headStyles: { fillColor: [30, 58, 95] } });
  doc.save('reportabilidad.pdf');
});

el('btnCorreo').addEventListener('click', async () => {
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
