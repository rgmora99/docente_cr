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

const plannerRoot = document.querySelector('#weeklyPlannerCalendar');

if (plannerRoot) {
  const gradeInput = document.querySelector('#plannerGrade');
  const subjectInput = document.querySelector('#plannerSubject');
  const sectionInput = document.querySelector('#plannerSection');
  const monthLabel = document.querySelector('#plannerMonthLabel');
  const monthGrid = document.querySelector('#plannerMonthGrid');
  const selectedDateLabel = document.querySelector('#plannerSelectedDateLabel');
  const dayNotesInput = document.querySelector('#plannerDayNotes');
  const prevMonthButton = document.querySelector('#plannerPrevMonth');
  const nextMonthButton = document.querySelector('#plannerNextMonth');

  const calendarDate = new Date();
  calendarDate.setDate(1);
  let selectedDate = new Date();

  const spanishMonths = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const spanishWeekDays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const getDayKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getProfileKey = () => {
    const grade = gradeInput.value.trim().toLowerCase() || 'general';
    const subject = subjectInput.value.trim().toLowerCase() || 'todas';
    const section = sectionInput.value.trim().toLowerCase() || 'sin-seccion';
    return `plannerData::${grade}::${subject}::${section}`;
  };

  const readPlannerData = () => {
    const rawData = localStorage.getItem(getProfileKey());
    if (!rawData) return {};

    try {
      return JSON.parse(rawData);
    } catch (_error) {
      return {};
    }
  };

  const savePlannerData = (data) => {
    localStorage.setItem(getProfileKey(), JSON.stringify(data));
  };

  const updateSelectedDateLabel = () => {
    const dayName = spanishWeekDays[selectedDate.getDay()];
    const monthName = spanishMonths[selectedDate.getMonth()];
    selectedDateLabel.textContent = `${dayName[0].toUpperCase()}${dayName.slice(1)} ${selectedDate.getDate()} de ${monthName} de ${selectedDate.getFullYear()}`;
  };

  const loadSelectedDayNotes = () => {
    const plannerData = readPlannerData();
    dayNotesInput.value = plannerData[getDayKey(selectedDate)] || '';
    updateSelectedDateLabel();
  };

  const renderCalendar = () => {
    monthGrid.innerHTML = '';

    const renderYear = calendarDate.getFullYear();
    const renderMonth = calendarDate.getMonth();
    const today = new Date();
    const monthStart = new Date(renderYear, renderMonth, 1);
    const monthEnd = new Date(renderYear, renderMonth + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const normalizedWeekday = (monthStart.getDay() + 6) % 7;

    monthLabel.textContent = `${spanishMonths[renderMonth][0].toUpperCase()}${spanishMonths[renderMonth].slice(1)} ${renderYear}`;

    let dayCounter = 1;
    for (let week = 0; week < 6; week += 1) {
      const row = document.createElement('tr');

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const cell = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'planner-day-btn';

        const shouldRenderDay = week > 0 || dayIndex >= normalizedWeekday;
        const dayValue = dayCounter <= daysInMonth ? dayCounter : null;

        if (shouldRenderDay && dayValue) {
          const currentDate = new Date(renderYear, renderMonth, dayValue);
          const isToday = currentDate.toDateString() === today.toDateString();
          const isSelected = currentDate.toDateString() === selectedDate.toDateString();

          button.textContent = String(dayValue);
          button.dataset.date = getDayKey(currentDate);

          if (isToday) button.classList.add('is-today');
          if (isSelected) button.classList.add('is-selected');

          button.addEventListener('click', () => {
            selectedDate = currentDate;
            renderCalendar();
            loadSelectedDayNotes();
          });

          dayCounter += 1;
        } else {
          button.classList.add('is-outside');
          button.disabled = true;
          button.textContent = '•';
        }

        cell.appendChild(button);
        row.appendChild(cell);
      }

      monthGrid.appendChild(row);
      if (dayCounter > daysInMonth) break;
    }
  };

  const persistCurrentNote = () => {
    const plannerData = readPlannerData();
    plannerData[getDayKey(selectedDate)] = dayNotesInput.value;
    savePlannerData(plannerData);
  };

  const restorePlannerProfile = () => {
    gradeInput.value = localStorage.getItem('plannerLastGrade') || '';
    subjectInput.value = localStorage.getItem('plannerLastSubject') || '';
    sectionInput.value = localStorage.getItem('plannerLastSection') || '';
  };

  const persistPlannerProfile = () => {
    localStorage.setItem('plannerLastGrade', gradeInput.value.trim());
    localStorage.setItem('plannerLastSubject', subjectInput.value.trim());
    localStorage.setItem('plannerLastSection', sectionInput.value.trim());
  };

  const handleProfileChange = () => {
    persistPlannerProfile();
    loadSelectedDayNotes();
  };

  prevMonthButton.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });

  [gradeInput, subjectInput, sectionInput].forEach((field) => {
    field.addEventListener('change', handleProfileChange);
  });

  dayNotesInput.addEventListener('input', persistCurrentNote);

  restorePlannerProfile();
  renderCalendar();
  loadSelectedDayNotes();
}
