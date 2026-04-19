import { state } from './state.js';

export function addSubject(subjectInfo, classes, course) {
  if (!subjectInfo || !subjectInfo.name || !subjectInfo.code) {
    console.error('Invalid subject data:', subjectInfo);
    return false;
  }

  // Check for duplicate
  const exists = state.subjects.find(
    s => s.code === subjectInfo.code && s.semester === subjectInfo.semester
  );
  if (exists) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Subject already added', showConfirmButton: false, timer: 2000 });
    return false;
  }

  const isLab = ['lab', 'laboratory', 'workshop', 'practical'].some(k =>
    subjectInfo.name.toLowerCase().includes(k)
  );

  state.subjects.push({
    id: Date.now() + Math.random(),
    name: subjectInfo.name,
    code: subjectInfo.code,
    credits: subjectInfo.credits || 0,
    semester: subjectInfo.semester || '',
    classes: classes || subjectInfo.credits || 0,
    course: course || state.selectedCourse || '',
    doublePeriod: isLab,
    facultyId: null,
    facultyName: null,
    division: null,
    roomNumber: null,
    isLabRoom: isLab,
    regularRoom: null
  });
  return true;
}

export function removeSubject(id) {
  state.subjects = state.subjects.filter(s => s.id !== id);
  // Also remove any teacher assigned to this subject
  state.teachers = state.teachers.filter(t => t.subjectId !== id);
}

export function assignFaculty(subjectId, facultyName) {
  const subject = state.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  if (!facultyName) {
    subject.facultyId = null;
    subject.facultyName = null;
    state.teachers = state.teachers.filter(t => t.subjectId !== subjectId);
    return;
  }

  // Reuse or create teacher entry
  let teacher = state.teachers.find(t => t.name === facultyName && t.subjectId === subjectId);
  if (!teacher) {
    // Remove old assignment for this subject
    state.teachers = state.teachers.filter(t => t.subjectId !== subjectId);
    const teacherId = Date.now() + Math.random();
    teacher = {
      id: teacherId,
      name: facultyName,
      subjectId: subjectId,
      subjectName: subject.name,
      semester: subject.semester,
      division: subject.division
    };
    state.teachers.push(teacher);
  }

  subject.facultyId = teacher.id;
  subject.facultyName = facultyName;
}
