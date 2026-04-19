import { state } from "../state/state.js";
import { dayNames, timeSlots } from "../data/constants.js";

export function exportToExcel() {
  if (Object.keys(state.routines).length === 0) {
    alert("No routine to export");
    return;
  }

  let csv = "\uFEFF"; // BOM for Excel UTF-8 support

  Object.keys(state.routines).forEach((semester) => {
    const routine = state.routines[semester];

    csv += `\n${semester}\n`;
    csv += "Day/Period";

    for (let p = 0; p < state.periodsPerDay; p++) {
      csv += `,Period ${p + 1} (${timeSlots[p]})`;
    }

    csv += "\n";

    for (let d = 0; d < state.days; d++) {
      csv += dayNames[d];

      for (let p = 0; p < state.periodsPerDay; p++) {
        const cls = routine[d]?.[p];

        if (cls && cls.lunch) {
          csv += ",LUNCH";
        } else if (cls) {
          csv += `,"${cls.subjectName} (${cls.subjectCode}) - ${cls.teacherName}${
            cls.division ? " [" + cls.division + "]" : ""
          }${cls.roomNumber ? " | Room: " + cls.roomNumber : ""}"`;
        } else {
          csv += ",Free";
        }
      }

      csv += "\n";
    }

    csv += "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `lecture-routine-${new Date()
    .toISOString()
    .split("T")[0]}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}