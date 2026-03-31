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

const appShell = document.querySelector('.app-shell.with-sidebar');
const sidebar = document.querySelector('#appSidebar');
const sidebarToggleButtons = document.querySelectorAll('[data-sidebar-toggle]');
const desktopBreakpoint = window.matchMedia('(min-width: 993px)');

const setDesktopCollapsedState = (isCollapsed) => {
  if (!appShell) return;
  appShell.classList.toggle('sidebar-collapsed', isCollapsed);
  localStorage.setItem('docenteSidebarCollapsed', isCollapsed ? '1' : '0');
};

const setMobileSidebarState = (isOpen) => {
  if (!sidebar) return;
  sidebar.classList.toggle('sidebar-open', isOpen);
  sidebar.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
};

if (appShell && sidebar) {
  const savedCollapsed = localStorage.getItem('docenteSidebarCollapsed') === '1';
  if (desktopBreakpoint.matches && savedCollapsed) {
    setDesktopCollapsedState(true);
  }

  sidebarToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (desktopBreakpoint.matches) {
        setDesktopCollapsedState(!appShell.classList.contains('sidebar-collapsed'));
      } else {
        setMobileSidebarState(!sidebar.classList.contains('sidebar-open'));
      }
    });
  });

  desktopBreakpoint.addEventListener('change', (event) => {
    if (event.matches) {
      setMobileSidebarState(false);
      if (localStorage.getItem('docenteSidebarCollapsed') === '1') {
        setDesktopCollapsedState(true);
      }
    } else {
      setDesktopCollapsedState(false);
    }
  });
}
