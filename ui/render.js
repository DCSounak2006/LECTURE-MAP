import { state } from "../state/state.js";

export function renderSubjects() {
  const tbody = document.querySelector('#subjectsTable tbody');
  tbody.innerHTML = '';

  state.subjects.forEach(subject => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${subject.name}</td>
      <td>${subject.code}</td>
      <td>${subject.classes}</td>
    `;

    tbody.appendChild(row);
  });
}

export function updateUI() {
  renderSubjects();
}