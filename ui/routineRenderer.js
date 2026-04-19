import { state } from "../state/state.js";
import { dayNames, timeSlots, semesterOrder } from "../data/constants.js";

export function renderRoutine() {
  const wrapper = document.getElementById("timetableWrapper");

  if (!state.routines || Object.keys(state.routines).length === 0) {
    wrapper.innerHTML = "<p>No routine generated</p>";
    return;
  }

  const activeSemesters = [
    ...semesterOrder.filter(sem => state.routines[sem]),
    ...Object.keys(state.routines).filter(sem => !semesterOrder.includes(sem))
  ];

  let html = "<table border='1'><thead>";
  html += createHeader();
  html += "</thead><tbody>";

  for (let d = 0; d < state.days; d++) {
    html += createDayRows(d, activeSemesters);
  }

  html += "</tbody></table>";
  wrapper.innerHTML = html;
}

function createHeader() {
  let html = "<tr>";
  html += "<th>Day</th><th>Semester</th>";

  for (let p = 0; p < state.periodsPerDay; p++) {
    html += `<th>P${p + 1}<br>${timeSlots[p] || ""}</th>`;
  }

  html += "</tr>";
  return html;
}

function createDayRows(dayIndex, semesters) {
  let html = "";

  semesters.forEach((sem, i) => {
    html += "<tr>";

    if (i === 0) {
      html += `<td rowspan="${semesters.length}">${dayNames[dayIndex] || ""}</td>`;
    }

    html += `<td>${sem}</td>`;

    for (let p = 0; p < state.periodsPerDay; p++) {
      html += createCell(sem, dayIndex, p);
    }

    html += "</tr>";
  });

  return html;
}

function createCell(semester, day, period) {
  const cls =
    state.routines?.[semester]?.[day]?.[period] || null;

  if (!cls) {
    return `<td style="color:#aaa">Free</td>`;
  }

  if (cls.lunch) {
    return `<td style="background:#fef3c7">LUNCH</td>`;
  }

  if (cls.continued) {
    return `<td style="background:#e0f2fe">⬆</td>`;
  }

  return `
    <td>
      <strong>${cls.subjectName || ""}</strong><br>
      ${cls.teacherName || ""}<br>
      📍 ${cls.roomNumber || "No Room"}
    </td>
  `;
}