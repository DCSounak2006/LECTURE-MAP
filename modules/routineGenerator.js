import { state } from "../state/state.js";
import { shuffleArray } from "../utils/helpers.js";

export function generateRoutine() {
  if (state.subjects.length === 0) {
    alert("Add subjects first");
    return;
  }

  const pool = createClassPool();
  assignClasses(pool);
}

function createClassPool() {
  const pool = [];

  state.subjects.forEach(subject => {
    for (let i = 0; i < subject.classes; i++) {
      pool.push({
        subjectId: subject.id,
        subjectName: subject.name,
        semester: subject.semester
      });
    }
  });

  shuffleArray(pool);
  return pool;
}

function assignClasses(pool) {
  state.routines = {};

  pool.forEach(cls => {
    if (!state.routines[cls.semester]) {
      state.routines[cls.semester] = [];
    }
  });
}