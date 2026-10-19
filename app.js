// ============ CONFIGURACIÓN DE SUPABASE ============
// La URL y la clave de API se pueden cambiar sin tocar el código:
//  1) Panel "⚙️ Configuración" en la pantalla de acceso (queda en el navegador)
//  2) Archivo config.js  ->  window.APP_CONFIG = { supabaseUrl, supabaseKey }
//  3) Valores por defecto de abajo
const CONFIG_POR_DEFECTO = {
  supabaseUrl: 'https://scndyoaynnagghydnjfp.supabase.co',
  supabaseKey: 'sb_publishable_Sp-E0KQuxWFgo7RKhhuGgQ_R2pnfSmj',
};
const LLAVE_CONFIG = 'reportabilidad.config';

function configGuardada() {
  try { return JSON.parse(localStorage.getItem(LLAVE_CONFIG) || '{}'); } catch { return {}; }
}
function guardarConfig(cfg) {
  try { localStorage.setItem(LLAVE_CONFIG, JSON.stringify(cfg)); } catch { /* modo privado */ }
}
function configActual() {
  const guardada = configGuardada();
  const archivo = window.APP_CONFIG || {};
  return {
    supabaseUrl: (guardada.supabaseUrl || archivo.supabaseUrl || CONFIG_POR_DEFECTO.supabaseUrl || '').trim(),
    supabaseKey: (guardada.supabaseKey || archivo.supabaseKey || CONFIG_POR_DEFECTO.supabaseKey || '').trim(),
  };
}

let sb = null;
function crearCliente(cfg = configActual()) {
  if (!cfg.supabaseUrl || !cfg.supabaseKey) throw new Error('Faltan la URL o la clave de Supabase.');
  sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  return sb;
}
try { crearCliente(); } catch { /* se avisa en la pantalla de acceso */ }

let trabajadores = [];
let registros = [];

// ============ MANEJO DE CLAVE (hash SHA-256) ============
// La clave ya no se guarda en texto plano: en la base de datos queda solo su hash.
const PUEDE_HASHEAR = !!(window.crypto && window.crypto.subtle);
async function hashTexto(texto) {
  if (PUEDE_HASHEAR) {
    const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Respaldo para entornos sin HTTPS (archivo abierto con doble clic)
  if (typeof window.sha256Respaldo === 'function') return window.sha256Respaldo(texto);
  return null;
}
function pareceHash(valor) {
  return typeof valor === 'string' && /^[0-9a-f]{64}$/i.test(valor.trim());
}
// Acepta el formato nuevo (hash) y el antiguo (texto plano) para no perder acceso.
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

// ============ DIAGNÓSTICO DE ERRORES ============
function explicarError(error) {
  const msg = String(error?.message || '').toLowerCase();
  const code = error?.code || '';
  if (code === 'PGRST116' || msg.includes('json object') || msg.includes('no rows')) {
    return {
      titulo: 'No hay ninguna clave configurada en la base de datos',
      detalle: 'La tabla clave_app está vacía. Ejecuta el SQL de la carpeta (supabase_setup.sql) en Supabase → SQL Editor → New query → Run.',
    };
  }
  if (code === '42P01' || msg.includes('does not exist') || msg.includes('no such table')) {
    return {
      titulo: 'Faltan las tablas en Supabase',
      detalle: 'Ejecuta supabase_setup.sql completo en el SQL Editor de tu proyecto de Supabase.',
    };
  }
  if (code === '42501' || msg.includes('row-level security') || msg.includes('permission denied') || msg.includes('violates row-level')) {
    return {
      titulo: 'Permisos bloqueados por RLS',
      detalle: 'Faltan las políticas de la tabla clave_app. Ejecuta las políticas que están al final de supabase_setup.sql (las que dicen "lectura_clave" y "escritura_clave").',
    };
  }
  if (code === 'PGRST301' || msg.includes('jwt') || msg.includes('apikey') || msg.includes('invalid key') || code === '401') {
    return {
      titulo: 'La clave de API no es válida',
      detalle: 'Copia la clave correcta desde Supabase → Project Settings → API Keys y pégala en ⚙️ Configuración.',
    };
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed') || msg.includes('err_name') || msg.includes('dns')) {
    return {
      titulo: 'No se pudo conectar con Supabase',
      detalle: 'Revisa la URL del proyecto en ⚙️ Configuración. Si el proyecto fue borrado, pausado o la URL está mal escrita, no hay forma de conectar: crea o recupera el proyecto y pega la URL y la clave correctas.',
    };
  }
  return { titulo: 'Error inesperado', detalle: error?.message || 'Sin detalle.' };
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
async function leerClaveRemota() {
  const { data, error } = await sb.from('clave_app').select('clave').eq('id', 1).maybeSingle();
  if (error) return { error };
  if (!data) return { vacio: true };
  return { clave: data.clave };
}

async function entrar() {
  const input = el('inputClave');
  const clave = input.value.trim();
  limpiarErrorLogin();
  if (!clave) return mostrarErrorLogin('Ingresa la clave', '');

  const boton = el('btnEntrar');
  boton.disabled = true;
  boton.textContent = 'Verificando...';
  try {
    const r = await leerClaveRemota();
    if (r.error) {
      const d = explicarError(r.error);
      return mostrarErrorLogin(d.titulo, d.detalle);
    }
    if (r.vacio) {
      return mostrarErrorLogin(
        'No hay ninguna clave configurada en la base de datos',
        'Ejecuta supabase_setup.sql en Supabase → SQL Editor → New query → Run. También puedes usar ⚙️ Configuración para revisar la URL y la clave de API.'
      );
    }
    if (await claveCoincide(clave, r.clave)) {
      input.value = '';
      sessionStorage.setItem('acceso', 'ok');
      mostrarApp();
      cargarDatos();
    } else {
      mostrarErrorLogin('Clave incorrecta', 'Verifica que esté bien escrita (distingue mayúsculas y no lleva espacios).');
    }
  } catch (e) {
    const d = explicarError(e);
    mostrarErrorLogin(d.titulo, d.detalle);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Entrar';
  }
}
el('btnEntrar').addEventListener('click', entrar);
el('inputClave').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });

if (sessionStorage.getItem('acceso') === 'ok') {
  mostrarApp();
  cargarDatos().then(resultado => {
    if (resultado && resultado.fatal) {
      sessionStorage.removeItem('acceso');
      mostrarLogin();
      mostrarErrorLogin(resultado.titulo, resultado.detalle);
    }
  });
}

// ============ PANEL DE CONFIGURACIÓN ============
function pintarConfig() {
  const cfg = configActual();
  el('cfgUrl').value = cfg.supabaseUrl;
  el('cfgKey').value = cfg.supabaseKey;
}
pintarConfig();

el('panelConfig').addEventListener('toggle', () => { if (el('panelConfig').open) pintarConfig(); });

async function probarConexion(cfg) {
  const cliente = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const { error } = await cliente.from('clave_app').select('clave', { count: 'exact' }).limit(1);
  return error ? { error } : { ok: true };
}

el('btnProbarConfig').addEventListener('click', async () => {
  const estado = el('estadoConfig');
  estado.textContent = 'Probando conexión...';
  const cfg = { supabaseUrl: el('cfgUrl').value.trim(), supabaseKey: el('cfgKey').value.trim() };
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return estado.textContent = '⚠️ Completa la URL y la clave.';
  const r = await probarConexion(cfg);
  if (r.error) {
    const d = explicarError(r.error);
    estado.textContent = `❌ ${d.titulo}. ${d.detalle}`;
  } else {
    estado.textContent = '✅ Conexión correcta: el proyecto responde y la tabla clave_app existe.';
  }
});

el('btnGuardarConfig').addEventListener('click', async () => {
  const estado = el('estadoConfig');
  const cfg = { supabaseUrl: el('cfgUrl').value.trim(), supabaseKey: el('cfgKey').value.trim() };
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return estado.textContent = '⚠️ Completa la URL y la clave.';
  estado.textContent = 'Probando conexión...';
  const r = await probarConexion(cfg);
  if (r.error) {
    const d = explicarError(r.error);
    estado.textContent = `❌ ${d.titulo}. ${d.detalle}`;
    return;
  }
  guardarConfig(cfg);
  crearCliente(cfg);
  estado.textContent = '✅ Guardado. Ya puedes entrar con tu clave.';
  limpiarErrorLogin();
  el('inputClave').focus();
});

el('btnRestablecerConfig').addEventListener('click', () => {
  guardarConfig({});
  pintarConfig();
  crearCliente();
  el('estadoConfig').textContent = 'Configuración restaurada a los valores por defecto.';
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
  if (!hash) alert('⚠️ Aviso: sin HTTPS no se puede cifrar la clave; se guardará en texto plano.');
  const valor = hash || limpia;

  const { error } = await sb.from('clave_app').upsert({ id: 1, clave: valor }, { onConflict: 'id' });
  if (error) {
    const d = explicarError(error);
    return alert(`No se pudo cambiar la clave.\n\n${d.titulo}\n${d.detalle}`);
  }
  alert('Clave actualizada ✅\n\nCierra sesión y entra con la nueva clave.');
  sessionStorage.removeItem('acceso');
  mostrarLogin();
  limpiarErrorLogin();
};

// ============ DATOS ============
async function cargarDatos() {
  const [resT, resR] = await Promise.all([
    sb.from('trabajadores').select('*').order('id'),
    sb.from('registros').select('*').order('fecha', { ascending: false }),
  ]);
  const error = resT.error || resR.error;
  if (error) {
    const d = explicarError(error);
    avisoEnApp(d.titulo, d.detalle);
    const esRed = /failed to fetch|networkerror|load failed|dns/i.test(String(error.message || ''));
    return { fatal: esRed, titulo: d.titulo, detalle: d.detalle };
  }
  trabajadores = resT.data || [];
  registros = resR.data || [];
  renderTrabajadores();
  renderRegistros();
  return { fatal: false };
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
  const visibles = registros.filter(r => !filtro || r.fecha === filtro);
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

el('formTrabajador').addEventListener('submit', async e => {
  e.preventDefault();
  const nuevo = {
    rut: el('rut').value.trim(),
    nombre: el('nombre').value.trim(),
    rol: el('rol').value.trim(),
    especialidad: el('especialidad').value.trim(),
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
el('btnLimpiarFiltro').addEventListener('click', () => { filtroFecha.value = ''; renderRegistros(); });
el('btnClave').addEventListener('click', window.cambiarClave);

function seleccionados() {
  const ids = [...document.querySelectorAll('.check-item:checked')].map(c => Number(c.dataset.id));
  return registros.filter(r => ids.includes(r.id));
}

el('btnPDF').addEventListener('click', () => {
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
