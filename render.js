import { state } from './state.js';
import { courseSubjects, facultyList } from './constants.js';
import { assignFaculty, removeSubject } from './subjects.js';
import { saveHistory } from './storage.js';
import { renderRoutine } from './routineRenderer.js';

export function renderSubjectsTable() {
  const tbody = document.querySelector('#subjectsTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (state.subjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px;">No subjects added yet</td></tr>';
    return;
  }

  state.subjects.forEach(subject => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${subject.course?.toUpperCase() || ''} — ${subject.semester}</td>
      <td>
        <strong>${subject.name}</strong>
        <div style="font-size:11px;color:#6b7280;">${subject.code}${subject.doublePeriod ? ' 🔬 Lab' : ''}</div>
      </td>
      <td style="text-align:center;">${subject.classes}</td>
      <td>
        <select class="faculty-dropdown" data-subjectid="${subject.id}">
          <option value="">— Unassigned —</option>
          ${facultyList.map(f => `<option value="${f}" ${subject.facultyName === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </td>
      <td>
        <button class="secondary remove-subject-btn" data-id="${subject.id}" style="padding:6px 12px;font-size:12px;">✕ Remove</button>
      </td>
    `;

    // Faculty assignment
    tr.querySelector('.faculty-dropdown').addEventListener('change', e => {
      saveHistory();
      assignFaculty(subject.id, e.target.value);
    });

    // Remove subject
    tr.querySelector('.remove-subject-btn').addEventListener('click', () => {
      saveHistory();
      removeSubject(subject.id);
      renderSubjectsTable();
      updateSummary();
    });

    tbody.appendChild(tr);
  });
}

export function updateSummary() {
  const totalSubjects = state.subjects.length;
  const totalTeachers = new Set(state.teachers.map(t => t.name)).size;
  const totalClasses = state.subjects.reduce((sum, s) => sum + (s.classes || 0), 0);
  const hasRoutine = Object.keys(state.routines).length > 0;

  const el = id => document.getElementById(id);
  if (el('summarySubjects')) el('summarySubjects').textContent = totalSubjects;
  if (el('summaryTeachers')) el('summaryTeachers').textContent = totalTeachers;
  if (el('summaryClasses')) el('summaryClasses').textContent = totalClasses;
  if (el('summaryStatus')) {
    el('summaryStatus').textContent = hasRoutine ? '✅ Generated' : 'Not Generated';
    el('summaryStatus').style.color = hasRoutine ? '#10b981' : '#6b7280';
    el('summaryStatus').style.fontSize = '16px';
  }
}

export function populateSemesterDropdown() {
  const courseEl = document.getElementById('courseSelect');
  const semesterEl = document.getElementById('semesterSelect');
  const subjectEl = document.getElementById('subjectName');
  const classesEl = document.getElementById('subjectClasses');
  const addBtn = document.getElementById('addSubject');

  if (!courseEl || !semesterEl) return;

  const course = courseEl.value;
  state.selectedCourse = course;

  // Reset downstream
  semesterEl.innerHTML = '<option value="">Select Semester</option>';
  subjectEl.innerHTML = '<option value="">First select semester</option>';
  semesterEl.disabled = !course;
  subjectEl.disabled = true;
  if (classesEl) { classesEl.value = 0; classesEl.disabled = true; }
  if (addBtn) addBtn.disabled = true;

  if (!course || !courseSubjects[course]) return;

  Object.keys(courseSubjects[course]).forEach(sem => {
    const opt = document.createElement('option');
    opt.value = sem;
    opt.textContent = sem;
    semesterEl.appendChild(opt);
  });
}

export function populateSubjectDropdown() {
  const courseEl = document.getElementById('courseSelect');
  const semesterEl = document.getElementById('semesterSelect');
  const subjectEl = document.getElementById('subjectName');
  const classesEl = document.getElementById('subjectClasses');
  const addBtn = document.getElementById('addSubject');

  if (!semesterEl || !subjectEl) return;

  const course = courseEl?.value || '';
  const semester = semesterEl.value;
  state.selectedSemester = semester;

  subjectEl.innerHTML = '<option value="">Select Subject</option>';
  subjectEl.disabled = !semester;
  if (classesEl) { classesEl.value = 0; classesEl.disabled = true; }
  if (addBtn) addBtn.disabled = true;

  if (!course || !semester || !courseSubjects[course]?.[semester]) return;

  courseSubjects[course][semester].forEach(subj => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify({ ...subj, semester, course });
    opt.textContent = `${subj.name} (${subj.code}) — ${subj.credits} cr`;
    subjectEl.appendChild(opt);
  });
}

export function onSubjectSelected() {
  const subjectEl = document.getElementById('subjectName');
  const classesEl = document.getElementById('subjectClasses');
  const addBtn = document.getElementById('addSubject');

  if (!subjectEl?.value) {
    if (classesEl) { classesEl.value = 0; classesEl.disabled = true; }
    if (addBtn) addBtn.disabled = true;
    return;
  }

  try {
    const parsed = JSON.parse(subjectEl.value);
    if (classesEl) {
      classesEl.value = parsed.credits || 0;
      classesEl.disabled = false;
    }
    if (addBtn) addBtn.disabled = false;
  } catch {}
}

export function updateUI() {
  renderSubjectsTable();
  renderRoutine();
  updateSummary();
}
