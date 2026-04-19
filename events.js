import { state } from './state.js';
import { addSubject } from './subjects.js';
import { generateRoutineEngine, autoFillFreedRooms } from './routineEngine.js';
import { saveToStorage, loadFromStorage, saveHistory, undo } from './storage.js';
import { renderRoutine, showFacultySchedule } from './routineRenderer.js';
import { renderSubjectsTable, updateSummary, updateUI, populateSemesterDropdown, populateSubjectDropdown, onSubjectSelected } from './render.js';
import { exportToCSV, exportToJSON, importFromJSON } from './exportexcel.js';

function el(id) { return document.getElementById(id); }

function showLoader(show) {
  const loader = el('loader');
  if (loader) loader.style.display = show ? 'flex' : 'none';
}

export function attachEventListeners() {

  // ── Cascading dropdowns ──
  el('courseSelect')?.addEventListener('change', populateSemesterDropdown);
  el('semesterSelect')?.addEventListener('change', populateSubjectDropdown);
  el('subjectName')?.addEventListener('change', onSubjectSelected);

  // ── Add Subject ──
  el('addSubject')?.addEventListener('click', () => {
    const subjectEl = el('subjectName');
    const classesEl = el('subjectClasses');
    const courseEl = el('courseSelect');

    if (!subjectEl?.value) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Select a subject first', showConfirmButton: false, timer: 2000 });
      return;
    }

    try {
      const parsed = JSON.parse(subjectEl.value);
      const classes = parseInt(classesEl?.value || parsed.credits || 0);
      const course = courseEl?.value || '';

      saveHistory();
      const added = addSubject(parsed, classes, course);
      if (added) {
        renderSubjectsTable();
        updateSummary();
        subjectEl.value = '';
        if (classesEl) { classesEl.value = 0; classesEl.disabled = true; }
        el('addSubject').disabled = true;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Subject added!', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      Swal.fire('Error', 'Invalid subject data: ' + err.message, 'error');
    }
  });

  // ── Generate Routine ──
  el('autoGenerate')?.addEventListener('click', () => {
    showLoader(true);
    saveHistory();

    setTimeout(() => {
      state.days = parseInt(el('daysSelect')?.value || 5);
      state.periodsPerDay = parseInt(el('periodsPerDay')?.value || 7);

      const success = generateRoutineEngine();
      renderRoutine();
      updateSummary();
      showLoader(false);

      if (success) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Routine generated!', showConfirmButton: false, timer: 2500 });
      }
    }, 600);
  });

  // ── Clear Routine ──
  el('clearRoutine')?.addEventListener('click', () => {
    Swal.fire({
      title: 'Clear Routine?',
      text: 'This will remove the generated timetable.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it'
    }).then(result => {
      if (result.isConfirmed) {
        saveHistory();
        state.routines = {};
        renderRoutine();
        updateSummary();
      }
    });
  });

  // ── Auto Fill Freed Rooms ──
  el('autoFillRooms')?.addEventListener('click', () => {
    saveHistory();
    autoFillFreedRooms();
    renderRoutine();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Freed rooms filled!', showConfirmButton: false, timer: 2000 });
  });

  // ── Save / Load / Undo / Reset ──
  el('saveBtn')?.addEventListener('click', saveToStorage);

  el('loadBtn')?.addEventListener('click', () => {
    const loaded = loadFromStorage();
    if (loaded) {
      if (el('daysSelect')) el('daysSelect').value = state.days;
      if (el('periodsPerDay')) el('periodsPerDay').value = state.periodsPerDay;
      updateUI();
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Data loaded!', showConfirmButton: false, timer: 2000 });
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'No saved data found', showConfirmButton: false, timer: 2000 });
    }
  });

  el('undoBtn')?.addEventListener('click', () => {
    if (undo()) {
      updateUI();
      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Undone!', showConfirmButton: false, timer: 1500 });
    }
  });

  el('clearAllBtn')?.addEventListener('click', () => {
    Swal.fire({
      title: 'Reset Everything?',
      text: 'All subjects, faculty, and routines will be cleared.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reset'
    }).then(result => {
      if (result.isConfirmed) {
        saveHistory();
        state.subjects = [];
        state.teachers = [];
        state.routines = {};
        updateUI();
      }
    });
  });

  // ── Export / Import ──
  el('exportCSV')?.addEventListener('click', exportToCSV);
  el('exportJSON')?.addEventListener('click', exportToJSON);
  el('exportExcel')?.addEventListener('click', exportToCSV);

  el('importJSON')?.addEventListener('click', () => el('jsonFileInput')?.click());
  el('jsonFileInput')?.addEventListener('change', e => {
    importFromJSON(e.target.files[0]);
    e.target.value = '';
  });

  // ── Print ──
  el('printRoutine')?.addEventListener('click', () => {
    if (Object.keys(state.routines).length === 0) {
      Swal.fire('No Routine', 'Generate a routine first.', 'warning');
      return;
    }
    window.print();
  });

  // ── Faculty Schedule (in-page overlay) ──
  el('facultyScheduleBtn')?.addEventListener('click', showFacultySchedule);

  // ── Footer links ──
  el('footerExport')?.addEventListener('click', e => { e.preventDefault(); exportToJSON(); });
  el('footerImport')?.addEventListener('click', e => { e.preventDefault(); el('jsonFileInput')?.click(); });
  el('footerFaculty')?.addEventListener('click', e => { e.preventDefault(); showFacultySchedule(); });

  // ── Days / Periods live update ──
  el('daysSelect')?.addEventListener('change', e => { state.days = parseInt(e.target.value); });
  el('periodsPerDay')?.addEventListener('change', e => { state.periodsPerDay = parseInt(e.target.value); });
}
