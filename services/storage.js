import { state } from "../state/state.js";

export function saveToStorage() {
  try {
    const data = {
      subjects: state.subjects || [],
      teachers: state.teachers || [],
      routines: state.routines || {},
      days: state.days || 5,
      periodsPerDay: state.periodsPerDay || 7
    };

    localStorage.setItem("lectureMapData", JSON.stringify(data));
  } catch (err) {
    console.error("Save failed:", err);
  }
}

export function loadFromStorage() {
  try {
    const data = localStorage.getItem("lectureMapData");
    if (!data) return;

    const parsed = JSON.parse(data);

    state.subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
    state.teachers = Array.isArray(parsed.teachers) ? parsed.teachers : [];
    state.routines = parsed.routines && typeof parsed.routines === "object" ? parsed.routines : {};

    state.days = Number(parsed.days) || 5;
    state.periodsPerDay = Number(parsed.periodsPerDay) || 7;

  } catch (err) {
    console.error("Load failed:", err);

    // fallback safe reset
    state.subjects = [];
    state.teachers = [];
    state.routines = {};
    state.days = 5;
    state.periodsPerDay = 7;
  }
}