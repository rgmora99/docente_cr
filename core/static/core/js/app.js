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

const plannerRoot = document.querySelector('#plannerBoard');

if (plannerRoot) {
  const profileSelect = document.querySelector('#plannerProfileSelect');
  const profileSummary = document.querySelector('#plannerSelectedProfileSummary');
  const plannerRangeLabel = document.querySelector('#plannerRangeLabel');
  const plannerViewSelect = document.querySelector('#plannerViewSelect');
  const plannerViewContainer = document.querySelector('#plannerViewContainer');
  const plannerPrevBtn = document.querySelector('#plannerPrevBtn');
  const plannerNextBtn = document.querySelector('#plannerNextBtn');
  const plannerTodayBtn = document.querySelector('#plannerTodayBtn');

  const spanishMonths = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fullDays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const hours = Array.from({ length: 12 }, (_item, index) => index + 7);

  let currentDate = new Date();

  const getMonday = (date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

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

  const getProfileKey = () => (profileSelect.value ? `plannerData::${profileSelect.value}` : null);

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

  const getSlotKey = (date, hour) => `${getDayKey(date)}::${hour}`;

  const saveSlotNote = (date, hour, value) => {
    const plannerData = readPlannerData();
    const slotKey = getSlotKey(date, hour);

    if (!value.trim()) {
      delete plannerData[slotKey];
    } else {
      plannerData[slotKey] = value.trim();
    }

    savePlannerData(plannerData);
  };

  const getSlotNote = (date, hour) => readPlannerData()[getSlotKey(date, hour)] || '';

  const renderTimeGrid = (dates) => {
    const table = document.createElement('table');
    table.className = 'table planner-time-grid mb-0';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const hourHeader = document.createElement('th');
    hourHeader.textContent = 'Hora';
    headRow.appendChild(hourHeader);

    dates.forEach((date) => {
      const th = document.createElement('th');
      th.innerHTML = `${fullDays[date.getDay()]}<br><span>${date.getDate()} ${spanishMonths[date.getMonth()].slice(0, 3)}.</span>`;
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    hours.forEach((hour) => {
      const row = document.createElement('tr');
      const hourCell = document.createElement('td');
      hourCell.className = 'planner-hour-cell';
      hourCell.textContent = `${String(hour).padStart(2, '0')}:00`;
      row.appendChild(hourCell);

      dates.forEach((date) => {
        const cell = document.createElement('td');
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = `planner-slot ${getSlotNote(date, hour) ? 'has-note' : ''}`;
        slot.textContent = getSlotNote(date, hour) || '+';
        slot.addEventListener('click', () => {
          const previous = getSlotNote(date, hour);
          const nextValue = window.prompt(`Programación para ${fullDays[date.getDay()]} ${date.getDate()} a las ${hour}:00`, previous);
          if (nextValue === null) return;
          saveSlotNote(date, hour, nextValue);
          renderPlannerView();
        });
        cell.appendChild(slot);
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);

    const wrapper = document.createElement('div');
    wrapper.className = 'table-responsive planner-time-grid-wrap';
    wrapper.appendChild(table);
    plannerViewContainer.innerHTML = '';
    plannerViewContainer.appendChild(wrapper);
  };

  const renderMonthGrid = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startWeekDay = (monthStart.getDay() + 6) % 7;

    const table = document.createElement('table');
    table.className = 'table planner-month-grid mb-0';
    table.innerHTML = `
      <thead><tr><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th><th>Dom</th></tr></thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    let dayCounter = 1;

    for (let week = 0; week < 6; week += 1) {
      const row = document.createElement('tr');
      for (let day = 0; day < 7; day += 1) {
        const cell = document.createElement('td');
        const shouldRender = week > 0 || day >= startWeekDay;

        if (shouldRender && dayCounter <= monthEnd.getDate()) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayCounter);
          const totalEvents = Object.keys(readPlannerData()).filter((key) => key.startsWith(`${getDayKey(date)}::`)).length;
          cell.className = 'planner-month-cell';
          cell.innerHTML = `<strong>${dayCounter}</strong><small>${totalEvents ? `${totalEvents} bloque(s)` : 'Sin bloques'}</small>`;
          dayCounter += 1;
        } else {
          cell.className = 'planner-month-cell is-empty';
          cell.textContent = '•';
        }

        row.appendChild(cell);
      }

      tbody.appendChild(row);
      if (dayCounter > monthEnd.getDate()) break;
    }

    plannerViewContainer.innerHTML = '<div class="table-responsive planner-month-grid-wrap"></div>';
    plannerViewContainer.querySelector('.planner-month-grid-wrap').appendChild(table);
  };

  const renderAgendaView = () => {
    const data = readPlannerData();
    const entries = Object.entries(data)
      .filter(([key, value]) => key.includes('::') && value)
      .map(([key, value]) => {
        const [datePart, hourPart] = key.split('::');
        return { datePart, hour: Number(hourPart), value };
      })
      .sort((a, b) => `${a.datePart}${a.hour}`.localeCompare(`${b.datePart}${b.hour}`));

    if (!entries.length) {
      plannerViewContainer.innerHTML = '<div class="planner-empty-view">No hay bloques programados para esta planeación.</div>';
      return;
    }

    plannerViewContainer.innerHTML = `
      <div class="planner-agenda-list">
        ${entries.map((entry) => `
          <article class="planner-agenda-item">
            <h6>${entry.datePart} · ${String(entry.hour).padStart(2, '0')}:00</h6>
            <p>${entry.value}</p>
          </article>
        `).join('')}
      </div>
    `;
  };

  const renderPlannerHeader = () => {
    const view = plannerViewSelect.value;
    if (view === 'month') {
      plannerRangeLabel.textContent = `${spanishMonths[currentDate.getMonth()][0].toUpperCase()}${spanishMonths[currentDate.getMonth()].slice(1)} ${currentDate.getFullYear()}`;
      return;
    }

    if (view === 'day') {
      plannerRangeLabel.textContent = `${currentDate.getDate()} de ${spanishMonths[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
      return;
    }

    const weekStart = getMonday(currentDate);
    const weekDates = view === 'workweek'
      ? Array.from({ length: 5 }, (_d, i) => addDays(weekStart, i))
      : Array.from({ length: 7 }, (_d, i) => addDays(weekStart, i));
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];
    plannerRangeLabel.textContent = `${start.getDate()} ${spanishMonths[start.getMonth()]} - ${end.getDate()} ${spanishMonths[end.getMonth()]} de ${end.getFullYear()}`;
  };

  const renderPlannerView = () => {
    renderPlannerHeader();
    if (!profileSelect.value) {
      plannerViewContainer.innerHTML = '<div class="planner-empty-view">Primero configura y selecciona una planeación.</div>';
      return;
    }

    const view = plannerViewSelect.value;
    if (view === 'month') {
      renderMonthGrid();
      return;
    }

    if (view === 'agenda') {
      renderAgendaView();
      return;
    }

    if (view === 'day') {
      renderTimeGrid([new Date(currentDate)]);
      return;
    }

    const weekStart = getMonday(currentDate);
    const dates = view === 'workweek'
      ? Array.from({ length: 5 }, (_d, i) => addDays(weekStart, i))
      : Array.from({ length: 7 }, (_d, i) => addDays(weekStart, i));

    renderTimeGrid(dates);
  };

  const renderProfileOptions = () => {
    const profiles = readTeacherProfiles();
    const currentSelection = localStorage.getItem('plannerSelectedProfileId');

    if (!profiles.length) {
      profileSelect.innerHTML = '<option value="">No hay planeaciones configuradas</option>';
      profileSelect.value = '';
      profileSummary.textContent = 'No tienes planeaciones todavía. Usa "Administrar planeaciones" para crear una.';
      renderPlannerView();
      return;
    }

    profileSelect.innerHTML = profiles.map((profile) => `<option value="${profile.id}">${profile.label}</option>`).join('');
    const selectedProfileExists = profiles.some((profile) => profile.id === currentSelection);
    profileSelect.value = selectedProfileExists ? currentSelection : profiles[0].id;
    localStorage.setItem('plannerSelectedProfileId', profileSelect.value);

    const profile = getSelectedProfile();
    profileSummary.textContent = profile ? `Trabajando con: ${profile.label}` : '';
    renderPlannerView();
  };

  const moveCurrentDate = (direction) => {
    const view = plannerViewSelect.value;
    const days = view === 'day' ? 1 : (view === 'month' ? 30 : 7);
    currentDate = addDays(currentDate, direction * days);
    renderPlannerView();
  };

  plannerPrevBtn.addEventListener('click', () => moveCurrentDate(-1));
  plannerNextBtn.addEventListener('click', () => moveCurrentDate(1));
  plannerTodayBtn.addEventListener('click', () => {
    currentDate = new Date();
    renderPlannerView();
  });

  plannerViewSelect.addEventListener('change', renderPlannerView);

  profileSelect.addEventListener('change', () => {
    localStorage.setItem('plannerSelectedProfileId', profileSelect.value);
    const profile = getSelectedProfile();
    profileSummary.textContent = profile ? `Trabajando con: ${profile.label}` : '';
    renderPlannerView();
  });

  renderProfileOptions();
}
