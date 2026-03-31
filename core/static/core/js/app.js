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

const normalizeProfileLabel = (profile) => {
  const sectionLabel = profile.section ? ` · Sección ${profile.section}` : '';
  return `${profile.grade} · ${profile.subject}${sectionLabel}`;
};

const readTeacherProfiles = () => {
  const rawData = localStorage.getItem('teacherPlanningProfiles');
  if (!rawData) return [];

  try {
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const saveTeacherProfiles = (profiles) => {
  localStorage.setItem('teacherPlanningProfiles', JSON.stringify(profiles));
};

const profileMaintenanceForm = document.querySelector('#teacherProfileForm');

if (profileMaintenanceForm) {
  const gradeField = document.querySelector('#profileGrade');
  const subjectField = document.querySelector('#profileSubject');
  const sectionField = document.querySelector('#profileSection');
  const profilesList = document.querySelector('#teacherProfilesList');
  const profilesCounter = document.querySelector('#teacherProfilesCounter');

  const renderProfiles = () => {
    const profiles = readTeacherProfiles();
    profilesCounter.textContent = String(profiles.length);

    if (!profiles.length) {
      profilesList.innerHTML = '<p class="text-muted mb-0">Aún no tienes planeaciones configuradas.</p>';
      return;
    }

    profilesList.innerHTML = profiles.map((profile) => `
      <div class="teacher-profile-item d-flex justify-content-between align-items-center gap-2">
        <div>
          <h6 class="mb-1">${profile.grade} · ${profile.subject}</h6>
          <small class="text-muted">${profile.section || 'Sin sección'} · ${profile.label}</small>
        </div>
        <button class="btn btn-sm btn-outline-danger rounded-pill" type="button" data-delete-profile="${profile.id}">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `).join('');
  };

  profileMaintenanceForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const grade = gradeField.value.trim();
    const subject = subjectField.value.trim();
    const section = sectionField.value.trim();

    if (!grade || !subject) return;

    const profiles = readTeacherProfiles();
    profiles.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      grade,
      subject,
      section,
      label: normalizeProfileLabel({ grade, subject, section }),
    });

    saveTeacherProfiles(profiles);
    profileMaintenanceForm.reset();
    renderProfiles();
  });

  profilesList.addEventListener('click', (event) => {
    const target = event.target.closest('[data-delete-profile]');
    if (!target) return;

    const profileId = target.dataset.deleteProfile;
    const filteredProfiles = readTeacherProfiles().filter((profile) => profile.id !== profileId);
    saveTeacherProfiles(filteredProfiles);

    if (localStorage.getItem('plannerSelectedProfileId') === profileId) {
      localStorage.removeItem('plannerSelectedProfileId');
    }

    renderProfiles();
  });

  renderProfiles();
}

const plannerRoot = document.querySelector('#weeklyPlannerCalendar');

if (plannerRoot) {
  const profileSelect = document.querySelector('#plannerProfileSelect');
  const profileSummary = document.querySelector('#plannerSelectedProfileSummary');
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

  const getSelectedProfile = () => {
    const profiles = readTeacherProfiles();
    return profiles.find((profile) => profile.id === profileSelect.value) || null;
  };

  const getProfileKey = () => {
    if (!profileSelect.value) return null;
    return `plannerData::${profileSelect.value}`;
  };

  const readPlannerData = () => {
    const profileKey = getProfileKey();
    if (!profileKey) return {};

    const rawData = localStorage.getItem(profileKey);
    if (!rawData) return {};

    try {
      return JSON.parse(rawData);
    } catch (_error) {
      return {};
    }
  };

  const savePlannerData = (data) => {
    const profileKey = getProfileKey();
    if (!profileKey) return;
    localStorage.setItem(profileKey, JSON.stringify(data));
  };

  const updateSelectedDateLabel = () => {
    const dayName = spanishWeekDays[selectedDate.getDay()];
    const monthName = spanishMonths[selectedDate.getMonth()];
    selectedDateLabel.textContent = `${dayName[0].toUpperCase()}${dayName.slice(1)} ${selectedDate.getDate()} de ${monthName} de ${selectedDate.getFullYear()}`;
  };

  const loadSelectedDayNotes = () => {
    if (!profileSelect.value) {
      dayNotesInput.value = '';
      dayNotesInput.disabled = true;
      dayNotesInput.placeholder = 'Primero configura y selecciona una planeación para habilitar notas.';
      updateSelectedDateLabel();
      return;
    }

    const plannerData = readPlannerData();
    dayNotesInput.value = plannerData[getDayKey(selectedDate)] || '';
    dayNotesInput.disabled = false;
    dayNotesInput.placeholder = 'Escribe actividades, objetivos, evaluaciones o recursos para el día seleccionado...';
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
    if (!profileSelect.value) return;
    const plannerData = readPlannerData();
    plannerData[getDayKey(selectedDate)] = dayNotesInput.value;
    savePlannerData(plannerData);
  };

  const renderProfileOptions = () => {
    const profiles = readTeacherProfiles();
    const currentSelection = localStorage.getItem('plannerSelectedProfileId');

    if (!profiles.length) {
      profileSelect.innerHTML = '<option value="">No hay planeaciones configuradas</option>';
      profileSelect.value = '';
      profileSummary.textContent = 'No tienes planeaciones todavía. Usa el botón "Administrar planeaciones" para crear una.';
      loadSelectedDayNotes();
      return;
    }

    profileSelect.innerHTML = profiles.map((profile) => `
      <option value="${profile.id}">${profile.label}</option>
    `).join('');

    const selectedProfileExists = profiles.some((profile) => profile.id === currentSelection);
    profileSelect.value = selectedProfileExists ? currentSelection : profiles[0].id;
    localStorage.setItem('plannerSelectedProfileId', profileSelect.value);

    const profile = getSelectedProfile();
    profileSummary.textContent = profile ? `Trabajando con: ${profile.label}` : '';
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

  profileSelect.addEventListener('change', () => {
    localStorage.setItem('plannerSelectedProfileId', profileSelect.value);
    const profile = getSelectedProfile();
    profileSummary.textContent = profile ? `Trabajando con: ${profile.label}` : '';
    loadSelectedDayNotes();
  });

  dayNotesInput.addEventListener('input', persistCurrentNote);

  renderCalendar();
  renderProfileOptions();
}
