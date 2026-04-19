import { state } from './state.js';
import { dayNames, timeSlots } from './constants.js';

export function exportToCSV() {
  if (Object.keys(state.routines).length === 0) {
    Swal.fire('No Routine', 'Generate a routine first.', 'warning');
    return;
  }

  let csv = '\uFEFF';

  Object.keys(state.routines).forEach(semester => {
    const routine = state.routines[semester];
    csv += `\n${semester}\n`;
    csv += 'Day/Period';
    for (let p = 0; p < state.periodsPerDay; p++) {
      csv += `,Period ${p + 1} (${timeSlots[p] || ''})`;
    }
    csv += '\n';

    for (let d = 0; d < state.days; d++) {
      csv += dayNames[d];
      for (let p = 0; p < state.periodsPerDay; p++) {
        const cls = routine[d]?.[p];
        if (cls && cls.lunch) csv += ',LUNCH';
        else if (cls && cls.continued) csv += ',↑ (cont.)';
        else if (cls) csv += `,"${cls.subjectName} (${cls.subjectCode || ''}) - ${cls.teacherName || ''}${cls.roomNumber ? ' | ' + cls.roomNumber : ''}"`;
        else csv += ',Free';
      }
      csv += '\n';
    }
    csv += '\n';
  });

  downloadFile(csv, `lecture-routine-${today()}.csv`, 'text/csv;charset=utf-8;');
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'CSV exported!', showConfirmButton: false, timer: 2000 });
}

export function exportToJSON() {
  const data = {
    subjects: state.subjects,
    teachers: state.teachers,
    routines: state.routines,
    days: state.days,
    periodsPerDay: state.periodsPerDay,
    exportedAt: new Date().toISOString()
  };
  downloadFile(JSON.stringify(data, null, 2), `lecture-map-${today()}.json`, 'application/json');
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'JSON exported!', showConfirmButton: false, timer: 2000 });
}

export function importFromJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      state.subjects = data.subjects || [];
      state.teachers = data.teachers || [];
      state.routines = data.routines || {};
      state.days = data.days || 5;
      state.periodsPerDay = data.periodsPerDay || 7;

      const daysEl = document.getElementById('daysSelect');
      const periodsEl = document.getElementById('periodsPerDay');
      if (daysEl) daysEl.value = state.days;
      if (periodsEl) periodsEl.value = state.periodsPerDay;

      import('./render.js').then(m => m.updateUI());
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'JSON imported!', showConfirmButton: false, timer: 2000 });
    } catch (err) {
      Swal.fire('Error', 'Invalid JSON file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().split('T')[0];
}
