// ============ FONDO 3D CORPORATIVO (GRILLA) ============
const canvas = document.getElementById('fondo3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
// En móviles de gama baja usamos menos resolución de render
if (window.innerWidth < 768) renderer.setPixelRatio(1);
camera.position.set(0, 12, 22);
camera.lookAt(0, 0, 0);

// Pausar el fondo cuando la pestaña no está visible (ahorro de batería/CPU)

const grilla = new THREE.GridHelper(200, 50, 0x3b82f6, 0x1d4ed8);
grilla.material.transparent = true;
grilla.material.opacity = 0.6;
scene.add(grilla);

function animarFondo() {
  requestAnimationFrame(animarFondo);
  if (document.hidden) return; // ahorro de recursos en segundo plano
  grilla.position.z = (grilla.position.z + 0.05) % 4;
  renderer.render(scene, camera);
}
animarFondo();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============ ANIMACIONES CON GSAP ============
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!movimientoReducido) {
  gsap.from('h1', { y: -40, opacity: 0, duration: 0.8, ease: 'power3.out' });
  gsap.from('.form-card, .table-card', { y: 40, opacity: 0, duration: 0.7, stagger: 0.2, ease: 'power2.out', delay: 0.2 });
  gsap.from('.login-card', { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
}

// Animación al agregar filas
const observer = new MutationObserver(() => {
  if (!movimientoReducido) gsap.from('#tbody tr:last-child, #tbodyTrabajadores tr:last-child', { x: -30, opacity: 0, duration: 0.4, ease: 'power2.out' });
});
observer.observe(document.getElementById('tbody'), { childList: true });
observer.observe(document.getElementById('tbodyTrabajadores'), { childList: true });
