import { state } from "../state/state.js";
import { rooms, labs } from "../data/constants.js";
import { shuffleArray } from "../utils/helpers.js";

export function generateRoutineEngine() {
  const days = state.days;
  const periods = state.periodsPerDay;

  state.routines = {};

  const roomUsage = createRoomTracker(days, periods);
  const teacherUsage = {};

  const semesters = getSemesters();
  const pool = buildClassPool();

  shuffleArray(pool);

  // INIT TIMETABLE
  for (let sem of semesters) {
    state.routines[sem] = Array(days)
      .fill(null)
      .map(() => Array(periods).fill(null));

    for (let d = 0; d < days; d++) {
      state.routines[sem][d][3] = { lunch: true };
    }
  }

  const success = smartBacktrack(
    0,
    pool,
    semesters,
    roomUsage,
    teacherUsage,
    days,
    periods
  );

  console.log("Scheduling success:", success);
}

/* =========================
   SMART BACKTRACK ENGINE
========================= */

function smartBacktrack(index, pool, semesters, roomUsage, teacherUsage, days, periods) {
  if (index >= pool.length) return true;

  const cls = pool[index];

  const slots = [];

  for (let sem of semesters) {
    for (let d = 0; d < days; d++) {
      for (let p = 0; p < periods; p++) {

        if (p === 3) continue;
        if (state.routines[sem][d][p]) continue;

        const teacherKey = `${cls.teacherId}_${d}_${p}`;
        if (teacherUsage[teacherKey]) continue;

        const room = findAvailableRoom(roomUsage, d, p, cls);
        if (!room) continue;

        slots.push({
          sem,
          d,
          p,
          room,
          teacherKey,
          score: scoreSlot(d, p, cls)
        });
      }
    }
  }

  if (slots.length === 0) return false;

  slots.sort((a, b) => b.score - a.score);

  for (let slot of slots) {
    const { sem, d, p, room, teacherKey } = slot;

    state.routines[sem][d][p] = {
      ...cls,
      roomNumber: room
    };

    teacherUsage[teacherKey] = true;
    roomUsage[d][p].add(room);

    if (
      smartBacktrack(index + 1, pool, semesters, roomUsage, teacherUsage, days, periods)
    ) {
      return true;
    }

    // BACKTRACK
    state.routines[sem][d][p] = null;
    roomUsage[d][p].delete(room);
    delete teacherUsage[teacherKey];
  }

  return false;
}

/* =========================
   SLOT SCORING
========================= */

function scoreSlot(day, period, cls) {
  let score = 0;

  if (period >= 1 && period <= 4) score += 5;
  if (period === 0) score -= 2;
  score += day;

  if (cls.subjectName?.toLowerCase().includes("lab")) {
    score += 2;
  }

  return score;
}

/* =========================
   HELPERS
========================= */

function getSemesters() {
  return Object.keys(state.routines || {});
}

function buildClassPool() {
  const pool = [];

  state.subjects.forEach(subject => {
    for (let i = 0; i < subject.classes; i++) {
      pool.push({
        subjectId: subject.id,
        subjectName: subject.name,
        semester: subject.semester,
        teacherId: subject.facultyId,
        teacherName: subject.facultyName,
        division: subject.division,
        isLab: subject.doublePeriod || false
      });
    }
  });

  return pool;
}

function createRoomTracker(days, periods) {
  return Array(days)
    .fill(null)
    .map(() =>
      Array(periods)
        .fill(null)
        .map(() => new Set())
    );
}

function findAvailableRoom(roomUsage, day, period, cls) {
  // FIX: correct room selection logic
  const pool = cls.isLab ? labs : rooms;

  for (let room of pool) {
    if (!roomUsage[day][period].has(room)) {
      return room;
    }
  }

  return null;
}