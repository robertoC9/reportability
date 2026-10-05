// ============ ANIMACIONES SUTILES CON GSAP ============
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!movimientoReducido && window.gsap) {
  gsap.from('h1', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' });
  gsap.from('#app .card', { y: 24, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.15 });
  gsap.from('.login-card', { scale: 0.92, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' });

  // Animación al agregar filas nuevas en las tablas
  const animarFila = () => {
    gsap.from('#tbody tr:last-child, #tbodyTrabajadores tr:last-child', { x: -20, opacity: 0, duration: 0.3, ease: 'power2.out' });
  };
  const observer = new MutationObserver(animarFila);
  observer.observe(document.getElementById('tbody'), { childList: true });
  observer.observe(document.getElementById('tbodyTrabajadores'), { childList: true });
}
