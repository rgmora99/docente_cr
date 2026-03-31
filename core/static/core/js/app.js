document.querySelectorAll('.feature-card').forEach((card) => {
  card.addEventListener('mouseenter', () => card.classList.add('shadow'));
  card.addEventListener('mouseleave', () => card.classList.remove('shadow'));
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  document.querySelectorAll('.reveal-up').forEach((node) => {
    node.style.animation = 'none';
  });
}
