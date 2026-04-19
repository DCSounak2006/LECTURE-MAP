// readExcel.js — Non-module script (loaded before main.js)
// Uses window.__appState bridge set by main.js

const EXCEL_COL_TO_PERIOD = { 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6 };
const EXCEL_DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const FILLER_PREFIXES = [
  'library', 'sports', 'extra class', 'lunch', 't&p session', 'project work',
  'seminar', 'additional coding', 'communication skills', 'mathematics-i (lbc'
];
const LAB_ROOM_IDS = ['CL-1', 'CL-2', 'CL-3', 'CL-3A', 'CL-3B', 'CL-4', 'CL-5',
  'LAB 1', 'LAB 2', 'LAB 3-1', 'LAB 3-B', 'LAB 4'];

function isLabRoom(roomId) {
  if (!roomId) return false;
  const r = roomId.toUpperCase().trim();
  return LAB_ROOM_IDS.some(l => r.includes(l.toUpperCase()));
}

function isLabSubject(name) {
  const n = name.toLowerCase();
  return ['lab', 'laboratory', 'workshop', 'practical'].some(k => n.includes(k));
}

function detectCourse(section) {
  const s = section.toUpperCase();
  if (s.startsWith('CST') || s.startsWith('AIML')) return 'diploma';
  return 'btech';
}

function parseCellText(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (FILLER_PREFIXES.some(f => lower.startsWith(f))) return null;

  const name = trimmed.split('(')[0].trim();
  if (!name) return null;

  const codeMatch = trimmed.match(/\(([A-Z][A-Z0-9 \-/]+)\)/);
  const code = codeMatch ? codeMatch[1].trim() : name.substring(0, 8).trim();

  const allParens = [...trimmed.matchAll(/\(([^)]+)\)/g)];
  let teacherName = 'Unassigned';
  for (let i = allParens.length - 1; i >= 0; i--) {
    const val = allParens[i][1].trim();
    if (/\d{3}/.test(val)) continue;
    if (/^(CL|R-)/i.test(val)) continue;
    if (val.startsWith('+')) continue;
    if (val === 'IPIM') continue;
    teacherName = val;
    break;
  }

  let roomNumber = null;
  const roomMatch = trimmed.match(/\[([^\]]+)\]/);
  if (roomMatch) roomNumber = roomMatch[1].trim();

  return { name, code, teacherName, roomNumber };
}

function extractSubjectsFromRows(rows) {
  const subjectMap = {};
  let currentDayIndex = -1;

  for (const row of rows) {
    if (!row) continue;
    const col0 = row[0];
    if (typeof col0 === 'string') {
      const upper = col0.trim().toUpperCase();
      const dayIdx = EXCEL_DAY_NAMES.indexOf(upper);
      if (dayIdx !== -1) { currentDayIndex = dayIdx; continue; }
      if (upper === 'DAY' || upper.includes('CLASS ROUTINE')) continue;
    }
    if (currentDayIndex < 0) continue;

    const section = row[2];
    if (!section || typeof section !== 'string' || !section.trim()) continue;
    const sectionKey = section.trim();

    const adjacentPairs = [[3, 4], [4, 5], [7, 8], [8, 9]];
    const countedAsDouble = new Set();

    for (const [colA, colB] of adjacentPairs) {
      const valA = row[colA];
      const valB = row[colB];
      const aHasValue = typeof valA === 'string' && valA.trim();
      const bIsEmpty = valB === null || valB === undefined ||
        (typeof valB === 'string' && !valB.trim());

      if (aHasValue && bIsEmpty) {
        const parsed = parseCellText(valA);
        if (!parsed) continue;
        const mapKey = `${parsed.code}__${sectionKey}`;
        if (!subjectMap[mapKey]) {
          subjectMap[mapKey] = {
            name: parsed.name, code: parsed.code,
            section: sectionKey, teacherName: parsed.teacherName,
            count: 0, doublePeriod: false, roomNumber: parsed.roomNumber || null
          };
        }
        if (parsed.roomNumber && !subjectMap[mapKey].roomNumber)
          subjectMap[mapKey].roomNumber = parsed.roomNumber;
        subjectMap[mapKey].count++;
        if (isLabSubject(parsed.name)) subjectMap[mapKey].doublePeriod = true;
        countedAsDouble.add(colA);
        countedAsDouble.add(colB);
      }
    }

    for (const col of [3, 4, 5, 7, 8, 9]) {
      if (countedAsDouble.has(col)) continue;
      const val = row[col];
      if (!val || typeof val !== 'string' || !val.trim()) continue;
      const parsed = parseCellText(val);
      if (!parsed) continue;
      const mapKey = `${parsed.code}__${sectionKey}`;
      if (!subjectMap[mapKey]) {
        subjectMap[mapKey] = {
          name: parsed.name, code: parsed.code,
          section: sectionKey, teacherName: parsed.teacherName,
          count: 0, doublePeriod: false, roomNumber: parsed.roomNumber || null
        };
      }
      if (parsed.roomNumber && !subjectMap[mapKey].roomNumber)
        subjectMap[mapKey].roomNumber = parsed.roomNumber;
      subjectMap[mapKey].count++;
    }
  }

  const subjects = [];
  const teachers = [];
  let idCounter = Date.now();
  const sections = new Set();

  for (const entry of Object.values(subjectMap)) {
    sections.add(entry.section);
    const subjectId = idCounter++;
    const teacherId = idCounter++;

    subjects.push({
      id: subjectId,
      course: detectCourse(entry.section),
      name: entry.name,
      code: entry.code,
      credits: entry.count,
      semester: entry.section,
      classes: entry.count,
      doublePeriod: entry.doublePeriod,
      facultyId: entry.teacherName !== 'Unassigned' ? teacherId : null,
      facultyName: entry.teacherName !== 'Unassigned' ? entry.teacherName : null,
      division: entry.section,
      roomNumber: entry.roomNumber || null,
      isLabRoom: isLabSubject(entry.name)
    });

    if (entry.teacherName !== 'Unassigned') {
      teachers.push({
        id: teacherId,
        name: entry.teacherName,
        division: entry.section,
        subjectId: subjectId,
        subjectName: entry.name,
        semester: entry.section
      });
    }
  }

  return { subjects, teachers, sectionCount: sections.size };
}

// ── Main entry point (called by HTML inline onchange) ──
function importExcelRoutine(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames.find(n => n.trim().toUpperCase() === 'ROUTINE');
      if (!sheetName) {
        Swal.fire('Error', 'No "ROUTINE" sheet found in the Excel file.', 'error');
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      const extracted = extractSubjectsFromRows(rows);

      if (extracted.subjects.length === 0) {
        Swal.fire('Error', 'No subjects found in the Excel file.', 'error');
        return;
      }

      // Write into the shared state via the bridge
      const appState = window.__appState;
      if (!appState) {
        Swal.fire('Error', 'App not ready. Please wait and try again.', 'error');
        return;
      }

      // Save history via bridge
      window.__appBridge?.saveHistory();

      appState.subjects = extracted.subjects;
      appState.teachers = extracted.teachers;
      appState.routines = {};
      appState.days = 5;
      appState.periodsPerDay = 7;

      document.getElementById('daysSelect').value = '5';
      document.getElementById('periodsPerDay').value = '7';

      window.__appBridge?.updateUI();

      const doublePeriodCount = extracted.subjects.filter(s => s.doublePeriod).length;
      Swal.fire({
        icon: 'success',
        title: 'Excel Imported!',
        html: `Loaded <strong>${extracted.subjects.length}</strong> subjects across 
               <strong>${extracted.sectionCount}</strong> sections.<br>
               <strong>${doublePeriodCount}</strong> lab/double-period subjects detected.<br><br>
               Click <strong>"Generate All Semesters"</strong> to build the routine.`,
        confirmButtonText: 'OK'
      });

    } catch (err) {
      console.error('Excel import error:', err);
      Swal.fire('Error', 'Failed to parse Excel file: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}
