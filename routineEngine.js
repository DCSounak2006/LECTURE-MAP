import { state } from './state.js';
import { rooms, labs, dayNames, timeSlots } from './constants.js';
import { shuffleArray } from './helpers.js';

export function generateRoutineEngine() {
  if (state.subjects.length === 0) {
    Swal.fire('No Subjects', 'Please add subjects before generating a routine.', 'warning');
    return false;
  }

  const days = state.days;
  const periods = state.periodsPerDay;

  // Group subjects by semester
  const subjectsBySemester = {};
  state.subjects.forEach(subject => {
    if (!subjectsBySemester[subject.semester]) subjectsBySemester[subject.semester] = [];
    subjectsBySemester[subject.semester].push(subject);
  });

  state.routines = {};
  let allSuccess = true;

  for (const semester of Object.keys(subjectsBySemester)) {
    const semSubjects = subjectsBySemester[semester];

    // Init grid
    const routine = Array(days).fill(null).map(() => Array(periods).fill(null));
    for (let d = 0; d < days; d++) routine[d][3] = { lunch: true };

    // Build pools
    const singlePool = [];
    const doublePool = [];

    semSubjects.forEach(subject => {
      const teacher = state.teachers.find(t => t.id === subject.facultyId);
      const entry = {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        teacherId: teacher ? teacher.id : null,
        teacherName: teacher ? teacher.name : 'Unassigned',
        division: teacher ? teacher.division : null,
        semester,
        doublePeriod: !!subject.doublePeriod,
        roomNumber: subject.roomNumber || null,
        isLabRoom: subject.isLabRoom || false,
        regularRoom: subject.regularRoom || null
      };

      for (let i = 0; i < subject.classes; i++) {
        if (subject.doublePeriod) doublePool.push({ ...entry });
        else singlePool.push({ ...entry });
      }
    });

    shuffleArray(singlePool);
    shuffleArray(doublePool);

    // Place double-period (lab) classes first
    const allDoublePairs = [];
    for (let d = 0; d < days; d++) {
      [[0, 1], [1, 2], [4, 5], [5, 6]].forEach(([p1, p2]) => {
        if (p1 < periods && p2 < periods) allDoublePairs.push([d, p1, p2]);
      });
    }
    shuffleArray(allDoublePairs);

    for (const cls of doublePool) {
      let placed = false;
      for (const [d, p1, p2] of allDoublePairs) {
        if (routine[d][p1] === null && routine[d][p2] === null) {
          const room = findAvailableRoom(cls.isLabRoom);
          routine[d][p1] = { ...cls, roomNumber: cls.roomNumber || room };
          routine[d][p2] = { ...cls, roomNumber: cls.roomNumber || room, continued: true };
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Fall back to single slot
        singlePool.push({ ...cls, doublePeriod: false });
      }
    }

    // Place single-period classes — spread across days evenly
    const orderedSlots = [];
    for (let p = 0; p < periods; p++) {
      if (p === 3) continue;
      for (let d = 0; d < days; d++) orderedSlots.push([d, p]);
    }

    const teacherLastPeriod = {};
    let sIdx = 0;

    for (const [day, period] of orderedSlots) {
      if (routine[day][period] !== null) continue;
      if (sIdx >= singlePool.length) continue;

      let cls = singlePool[sIdx];

      // Try to avoid consecutive periods for same teacher
      for (let attempt = 0; attempt < 5; attempt++) {
        const key = `${cls.teacherId}_${day}`;
        if (cls.teacherId && teacherLastPeriod[key] === period - 1) {
          const alt = sIdx + 1 + Math.floor(Math.random() * Math.max(1, singlePool.length - sIdx - 1));
          if (alt < singlePool.length) {
            [singlePool[sIdx], singlePool[alt]] = [singlePool[alt], singlePool[sIdx]];
            cls = singlePool[sIdx];
          }
        } else break;
      }

      const room = findAvailableRoom(cls.isLabRoom);
      routine[day][period] = { ...cls, roomNumber: cls.roomNumber || room };
      if (cls.teacherId) teacherLastPeriod[`${cls.teacherId}_${day}`] = period;
      sIdx++;
    }

    state.routines[semester] = routine;
  }

  return allSuccess;
}

function findAvailableRoom(isLab) {
  const pool = isLab ? labs : rooms;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function autoFillFreedRooms() {
  if (Object.keys(state.routines).length === 0) return;

  const days = state.days;
  const periods = state.periodsPerDay;

  for (let d = 0; d < days; d++) {
    for (let p = 0; p < periods; p++) {
      if (p === 3) continue;

      const sectionsInLab = [];
      Object.keys(state.routines).forEach(semester => {
        const cls = state.routines[semester][d][p];
        if (cls && !cls.lunch && cls.isLabRoom) {
          sectionsInLab.push({ semester, freedRoom: cls.regularRoom || null, cls });
        }
      });

      if (sectionsInLab.length === 0) continue;

      Object.keys(state.routines).forEach(semester => {
        const cls = state.routines[semester][d][p];
        if (cls !== null) return;

        const freedEntry = sectionsInLab.find(entry => entry.semester !== semester);
        if (!freedEntry || !freedEntry.freedRoom) return;

        state.routines[semester][d][p] = {
          subjectName: 'Self Study',
          subjectCode: 'SS',
          teacherName: 'Available',
          teacherId: null,
          division: null,
          semester,
          roomNumber: freedEntry.freedRoom,
          isLabRoom: false,
          doublePeriod: false,
          freedFrom: freedEntry.semester,
          autoFilled: true
        };
      });
    }
  }
}
