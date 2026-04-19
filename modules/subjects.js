import { state } from "../state/state.js";

export function addSubject(subjectInfo, classes) {
  if (!subjectInfo || !subjectInfo.name || !subjectInfo.code) {
    console.error("Invalid subject data:", subjectInfo);
    return;
  }

  state.subjects.push({
    id: Date.now(),

    // core data
    name: subjectInfo.name,
    code: subjectInfo.code,
    credits: subjectInfo.credits || 0,
    semester: subjectInfo.semester || "",
    classes: classes || 0,

    // IMPORTANT (used in UI + engine)
    course: subjectInfo.course || state.selectedCourse || "",

    // faculty
    facultyId: null,
    facultyName: null,
    division: null
  });
}

export function getSubjectsBySemester(semester) {
  return state.subjects.filter(s => s.semester === semester);
}