import { state } from './state.js';
import { dayNames, timeSlots, semesterOrder } from './constants.js';
import { assignFaculty } from './subjects.js';
import { updateSummary } from './render.js';

// ── Main routine renderer ────────────────────────────────────────────────────

export function renderRoutine() {
  const wrapper = document.getElementById('timetableWrapper');
  if (!wrapper) return;

  if (!state.routines || Object.keys(state.routines).length === 0) {
    wrapper.innerHTML = `
      <p class="muted" style="text-align:center;padding:40px;">
        No routine generated yet. Add subjects and click "Generate All Semesters"
      </p>`;
    updateSummary();
    return;
  }

  const activeSemesters = [
    ...semesterOrder.filter(sem => state.routines[sem]),
    ...Object.keys(state.routines).filter(sem => !semesterOrder.includes(sem))
  ];

  let html = `<div style="overflow-x:auto"><table id="routineTable"><thead>`;

  // ── Header: Day/Time + Semester label column + period columns ───────────────
  html += `<tr>
    <th style="min-width:80px;">Day / Time</th>
    <th style="min-width:65px;">Semester</th>`;

  for (let p = 0; p < state.periodsPerDay; p++) {
    if (p === 3) {
      html += `<th min-width:70px;">
        LUNCH<br><span style="font-size:9px;font-weight:400;">${timeSlots[3] || '01:00-02:00'}</span>
      </th>`;
    } else {
      html += `<th style="min-width:110px;">
        Period ${p + 1}<br><span style="font-size:9px;font-weight:400;">${timeSlots[p] || ''}</span>
      </th>`;
    }
  }
  html += `</tr></thead><tbody>`;

  // ── Body: one block per day, one row per semester ───────────────────────────
  for (let d = 0; d < state.days; d++) {
    const dayName = dayNames[d] || `Day ${d + 1}`;

    activeSemesters.forEach((sem, semIdx) => {
      html += `<tr>`;

      // Day cell spans all semester rows for this day
      if (semIdx === 0) {
        html += `<td rowspan="${activeSemesters.length}"
          style="font-weight:700;background:linear-gradient(135deg,#eff6ff,#dbeafe);
                 color:#1e40af;text-align:center;vertical-align:middle;font-size:13px;
                 border-right:2px solid #c7d2fe;">
          ${dayName}
        </td>`;
      }

      // Semester label cell
      html += `<td style="font-size:10px;font-weight:700;background:#f0f9ff;
                           color:#0369a1;text-align:center;padding:6px 4px;
                           vertical-align:middle;border-right:1px solid #e0e7ff;">
        ${sem.replace('Semester ', 'Sem ')}
      </td>`;

      // ── Period cells with colspan merging for double/lab periods ───────────
      let p = 0;
      while (p < state.periodsPerDay) {

        // Fixed lunch column at index 3
        if (p === 3) {
          html += `<td class="lunch-period">LUNCH</td>`;
          p++;
          continue;
        }

        const cls = state.routines?.[sem]?.[d]?.[p] ?? null;

        // Skip "continued" cells — already merged into previous colspan
        if (cls && cls.continued) {
          p++;
          continue;
        }

        // Detect double period: current is real class, next slot is "continued" for same subject
        // but don't span across lunch (p+1 must not be 3)
        const nextP = p + 1;
        const next = (nextP < state.periodsPerDay && nextP !== 3)
          ? (state.routines?.[sem]?.[d]?.[nextP] ?? null)
          : null;

        const isDouble = cls && !cls.lunch &&
          next && next.continued &&
          next.subjectId === cls.subjectId;

        const span = isDouble ? 2 : 1;
        html += buildCell(cls, sem, d, p, span);
        p += span;
      }

      html += `</tr>`;
    });

    // Thin separator between days
    if (d < state.days - 1) {
      const totalCols = 2 + state.periodsPerDay;
      html += `<tr><td colspan="${totalCols}" style="padding:2px;background:#c7d2fe;"></td></tr>`;
    }
  }

  html += `</tbody></table></div>`;
  wrapper.innerHTML = html;

  // Attach faculty dropdown listeners
  wrapper.querySelectorAll('.faculty-dropdown').forEach(sel => {
    sel.addEventListener('change', e => {
      const subjectId = Number(e.target.dataset.subjectid);
      assignFaculty(subjectId, e.target.value);
      import('./render.js').then(m => m.renderSubjectsTable());
    });
  });

  updateSummary();
}

// ── Build a single <td> cell (span=1 normal, span=2 for double/lab) ──────────

function buildCell(cls, sem, day, period, span) {
  const colspanAttr = span > 1 ? `colspan="${span}"` : '';

  // Empty / Free slot
  if (!cls) {
    return `<td ${colspanAttr}
      style="color:#9ca3af;font-size:11px;text-align:center;cursor:pointer;
             vertical-align:middle;padding:8px 5px;">
      <div class="time-slot">${timeSlots[period] || ''}</div>
      Doubt Class
    </td>`;
  }

  // Lunch
  if (cls.lunch) {
    return `<td class="lunch-period">LUNCH</td>`;
  }

  // Auto-filled freed room
  if (cls.autoFilled) {
    return `<td ${colspanAttr} class="freed-cell"
      style="text-align:center;vertical-align:middle;padding:8px 5px;">
      <div class="time-slot">${timeSlots[period] || ''}</div>
      <strong style="font-size:11px;display:block;">Self Study</strong>
      <span class="room-badge-freed">${cls.roomNumber || ''}</span>
    </td>`;
  }

  // Normal / Lab class
  const isLab = cls.isLabRoom || span > 1;
  const bgStyle = isLab ? 'background:rgba(134, 239, 172, 0.2);' : '';
  const borderStyle = isLab ? 'border-left:3px solid rgba(124, 58, 237, 0.5);' : '';
  const roomBadgeClass = isLab ? 'room-badge-lab' : (cls.roomNumber ? 'room-badge' : 'room-badge-empty');
  const roomText = cls.roomNumber || 'No Room';

  const timeRange = span > 1 && timeSlots[period + 1]
    ? `${timeSlots[period]} – ${timeSlots[period + 1]}`
    : (timeSlots[period] || '');

  const labTag = span > 1
    ? `<span style="font-size:9px;color:#7c3aed;font-weight:700;">LAB (${span} periods)</span><br>`
    : '';

  return `<td ${colspanAttr}
    style="text-align:center;vertical-align:middle;cursor:pointer;
           padding:8px 5px;${bgStyle}${borderStyle}">
    ${labTag}
    <strong style="display:block;margin-bottom:4px;font-size:12px;color:#1e40af;">
      ${cls.subjectName || ''}
    </strong>
    <span class="teacher-label">${cls.teacherName || 'Unassigned'} - ${roomText}</span><br>
  </td>`;
}
// <span class="${roomBadgeClass}" style="margin-top:4px;"></span>
// ── Faculty Schedule — in-page full-screen overlay (like old design) ──────────

export function showFacultySchedule() {
  if (Object.keys(state.routines).length === 0) {
    Swal.fire('No Routine', 'Generate a routine first.', 'warning');
    return;
  }

  // Build faculty → schedule map
  const facultyMap = {};

  Object.keys(state.routines).forEach(semester => {
    const routine = state.routines[semester];
    for (let d = 0; d < state.days; d++) {
      for (let p = 0; p < state.periodsPerDay; p++) {
        const cls = routine[d]?.[p];
        if (!cls || cls.lunch || cls.continued || !cls.teacherName || cls.teacherName === 'Unassigned') continue;
        if (!facultyMap[cls.teacherName]) facultyMap[cls.teacherName] = [];
        facultyMap[cls.teacherName].push({
          day: dayNames[d],
          dayIdx: d,
          period: p + 1,
          periodIdx: p,
          time: timeSlots[p] || '',
          subject: cls.subjectName,
          code: cls.subjectCode || '',
          semester,
          room: cls.roomNumber || 'TBD',
          isLab: cls.isLabRoom || false,
          isDouble: cls.doublePeriod || false
        });
      }
    }
  });

  if (Object.keys(facultyMap).length === 0) {
    Swal.fire('No Faculty Assigned', 'Assign faculty to subjects first.', 'warning');
    return;
  }

  const sortedFaculty = Object.keys(facultyMap).sort();

  let html = `
  <div id="facultyScheduleOverlay" style="
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%);
    z-index:9999;overflow-y:auto;padding:30px 20px;">

    <div style="max-width:1000px;margin:0 auto;">

      <!-- Header bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:28px;
                  background:linear-gradient(-45deg,rgba(37,99,235,0.25),rgba(16,185,129,0.25),
                             rgba(59,130,246,0.25),rgba(30,64,175,0.25));
                  background-size:400% 400%;
                  border-radius:16px;padding:20px 24px;
                  border:1px solid rgba(255,255,255,0.2);
                  box-shadow:0 8px 32px rgba(0,0,0,0.2);">
        <h2 style="color:#fff;margin:0;font-size:1.6rem;font-weight:700;
                   text-shadow:0 2px 10px rgba(0,0,0,0.3);">
          👨‍🏫 Faculty Schedules
        </h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="window.__downloadFacultyCSV()" style="
            background:linear-gradient(135deg,#10b981,#059669);color:#fff;
            border:none;padding:10px 20px;border-radius:12px;cursor:pointer;
            font-weight:600;font-size:13px;
            box-shadow:0 4px 15px rgba(16,185,129,0.3);">
            ⬇️ Download CSV
          </button>
          <button onclick="document.getElementById('facultyScheduleOverlay').remove()" style="
            background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;
            border:none;padding:10px 20px;border-radius:12px;cursor:pointer;
            font-weight:600;font-size:13px;
            box-shadow:0 4px 15px rgba(239,68,68,0.3);">
            ✕ Close
          </button>
        </div>
      </div>

      <!-- Summary bar -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;">
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:12px 20px;
                    border:1px solid rgba(255,255,255,0.15);text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#60a5fa;">${sortedFaculty.length}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;">Faculty Members</div>
        </div>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:12px 20px;
                    border:1px solid rgba(255,255,255,0.15);text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#34d399;">
            ${Object.values(facultyMap).reduce((s, a) => s + a.length, 0)}
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;">Total Classes/Week</div>
        </div>
      </div>

      <!-- Faculty cards -->
      <div style="display:grid;gap:20px;">
  `;

  sortedFaculty.forEach(name => {
    const slots = facultyMap[name];
    const totalClasses = slots.length;
    const semesters = [...new Set(slots.map(s => s.semester))];
    const subjects = [...new Set(slots.map(s => s.subject))];

    html += `
    <div style="background:rgba(255,255,255,0.97);border-radius:20px;
                padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.2);
                border:1px solid rgba(255,255,255,0.5);
                animation:fadeIn 0.5s ease-out;">

      <!-- Faculty header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;
                  margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <div>
          <h3 style="margin:0 0 4px 0;color:#1e40af;font-size:1.15rem;font-weight:700;">
            ${name}
          </h3>
          <span style="font-size:12px;color:#6b7280;">
            ${totalClasses} class${totalClasses !== 1 ? 'es' : ''}/week
            &nbsp;|&nbsp; ${subjects.join(', ')}
          </span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${semesters.map(sem =>
      `<span style="background:linear-gradient(135deg,#dbeafe,#bfdbfe);
                          color:#1e40af;padding:4px 12px;border-radius:20px;
                          font-size:11px;font-weight:700;">${sem}</span>`
    ).join('')}
        </div>
      </div>

      <!-- Schedule table -->
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:separate;border-spacing:0;
                      border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 15px rgba(0,0,0,0.07);">
          <thead>
            <tr style="background:linear-gradient(135deg,#1e40af,#2563eb);">
              <th style="color:#fff;padding:11px 14px;font-size:11px;text-align:left;
                         font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Day</th>
              <th style="color:#fff;padding:11px 14px;font-size:11px;
                         font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Period</th>
              <th style="color:#fff;padding:11px 14px;font-size:11px;
                         font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Time</th>
              <th style="color:#fff;padding:11px 14px;font-size:11px;text-align:left;
                         font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Subject</th>
              <th style="color:#fff;padding:11px 14px;font-size:11px;text-align:left;
                         font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Semester</th>
              <th style="color:#fff;padding:11px 14px;font-size:11px;
                         font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Room</th>
            </tr>
          </thead>
          <tbody>
    `;

    slots
      .sort((a, b) => a.dayIdx - b.dayIdx || a.periodIdx - b.periodIdx)
      .forEach((slot, idx) => {
        const even = idx % 2 === 0;
        const labBorder = slot.isLab ? 'border-left:3px solid #7c3aed;' : '';
        html += `
          <tr style="background:${even ? '#fff' : '#fafbff'};${labBorder}
                     transition:all 0.2s ease;">
            <td style="padding:11px 14px;font-weight:700;color:#1e293b;font-size:13px;">
              ${slot.day}
            </td>
            <td style="padding:11px 14px;font-size:13px;color:#374151;text-align:center;">
              P${slot.period}${slot.isDouble ? '–P' + (slot.period + 1) : ''}
            </td>
            <td style="padding:11px 14px;font-size:12px;color:#6b7280;">${slot.time}</td>
            <td style="padding:11px 14px;">
              <strong style="font-size:13px;color:#1e40af;display:block;">${slot.subject}</strong>
              ${slot.code ? `<span style="font-size:10px;color:#9ca3af;">${slot.code}</span>` : ''}
              ${slot.isLab ? '<br><span style="font-size:9px;color:#7c3aed;font-weight:700;">⚗️ LAB</span>' : ''}
            </td>
            <td style="padding:11px 14px;">
              <span style="background:linear-gradient(135deg,#dbeafe,#bfdbfe);
                           color:#1e40af;padding:3px 10px;border-radius:12px;
                           font-size:11px;font-weight:700;">${slot.semester}</span>
            </td>
            <td style="padding:11px 14px;text-align:center;">
              <span style="background:${slot.isLab
            ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)'
            : 'linear-gradient(135deg,#d1fae5,#a7f3d0)'};
                           color:${slot.isLab ? '#6d28d9' : '#065f46'};
                           padding:3px 10px;border-radius:12px;
                           font-size:11px;font-weight:700;">
                ${slot.room}
              </span>
            </td>
          </tr>
        `;
      });

    html += `
          </tbody>
        </table>
      </div>
    </div>`;
  });

  html += `
      </div><!-- /grid -->
    </div><!-- /max-width -->
  </div><!-- /overlay -->`;

  // Remove old overlay if exists, then inject
  const existing = document.getElementById('facultyScheduleOverlay');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);

  // Expose CSV download to global (called from inline button)
  window.__downloadFacultyCSV = () => _downloadFacultyCSV(facultyMap);
}

// ── CSV download helper ───────────────────────────────────────────────────────

function _downloadFacultyCSV(facultyMap) {
  let csv = '\uFEFF';
  Object.keys(facultyMap).sort().forEach(name => {
    csv += `\n${name}\n`;
    csv += 'Day,Period,Time,Subject,Semester,Room\n';
    facultyMap[name]
      .sort((a, b) => a.dayIdx - b.dayIdx || a.periodIdx - b.periodIdx)
      .forEach(row => {
        csv += `${row.day},P${row.period},"${row.time}","${row.subject}","${row.semester}","${row.room}"\n`;
      });
    csv += '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `faculty-schedules-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'CSV downloaded!', showConfirmButton: false, timer: 2000 });
}
