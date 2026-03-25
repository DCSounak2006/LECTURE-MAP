// ============================================================
//  readExcel.js
//  Extracts subjects + faculty from the college Excel routine
//  and loads them into state.subjects + state.teachers so that
//  generateRoutineLogic() can run with double-period support.
// ============================================================

const EXCEL_COL_TO_PERIOD = { 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6 };
const EXCEL_DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const FILLER_PREFIXES = [
    'library', 'sports', 'extra class', 'lunch', 't&p session', 'project work',
    'seminar', 'additional coding', 'communication skills', 'mathematics-i (lbc'
];

// ── Main entry point ──────────────────────────────────────────────────────────

function importExcelRoutine(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const sheetName = workbook.SheetNames.find(
                n => n.trim().toUpperCase() === 'ROUTINE'
            );
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

            saveHistory();

            state.subjects = extracted.subjects;
            state.teachers = extracted.teachers;
            state.routines = {};
            state.days = 5;   // Mon–Fri
            state.periodsPerDay = 7;

            document.getElementById('daysSelect').value = '5';
            document.getElementById('periodsPerDay').value = '7';

            updateUI();

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

// ── Core extraction ───────────────────────────────────────────────────────────

function extractSubjectsFromRows(rows) {
    const subjectMap = {};  // key = "CODE__SECTION"
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

        // Consecutive column pairs that can form a double period
        // Only pairs that are truly adjacent periods (no lunch between them)
        const adjacentPairs = [[3, 4], [4, 5], [7, 8], [8, 9]];

        // Track which cols were already counted as part of a double period
        const countedAsDouble = new Set();

        // ── Pass 1: detect double-period labs (value in colA, null in colB) ──
        for (const [colA, colB] of adjacentPairs) {
            const valA = row[colA];
            const valB = row[colB];

            const aHasValue = typeof valA === 'string' && valA.trim();
            const bIsEmpty = valB === null || valB === undefined ||
                (typeof valB === 'number' && isNaN(valB)) ||
                (typeof valB === 'string' && !valB.trim());

            if (aHasValue && bIsEmpty) {
                const parsed = parseCellText(valA);
                if (!parsed) continue;

                const mapKey = `${parsed.code}__${sectionKey}`;
                if (!subjectMap[mapKey]) {
                    subjectMap[mapKey] = {
                        name: parsed.name, code: parsed.code,
                        section: sectionKey, teacherName: parsed.teacherName,
                        count: 0, doublePeriod: false
                    };
                }
                subjectMap[mapKey].count++;
                if (isLabSubject(parsed.name)) {
                    subjectMap[mapKey].doublePeriod = true;
                }
                countedAsDouble.add(colA);
                countedAsDouble.add(colB); // mark the empty col too so we skip it
            }
        }

        // ── Pass 2: single-period subjects (not part of a double-period) ──────
        for (const col of [3, 4, 5, 7, 8, 9]) {
            if (countedAsDouble.has(col)) continue; // already counted above

            const val = row[col];
            if (!val || typeof val !== 'string' || !val.trim()) continue;

            const parsed = parseCellText(val);
            if (!parsed) continue;

            const mapKey = `${parsed.code}__${sectionKey}`;
            if (!subjectMap[mapKey]) {
                subjectMap[mapKey] = {
                    name: parsed.name, code: parsed.code,
                    section: sectionKey, teacherName: parsed.teacherName,
                    count: 0, doublePeriod: false
                };
            }
            subjectMap[mapKey].count++;
        }
    }

    // ── Build state.subjects and state.teachers ───────────────────────────────
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
            division: entry.section
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

// ── Cell parser ───────────────────────────────────────────────────────────────

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

    return { name, code, teacherName };
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

// ── generateRoutineLogic (replaces the one in script.js) ─────────────────────

function generateRoutineLogic() {
    showLoader(true);
    saveHistory();

    setTimeout(() => {
        const days = state.days;
        const periods = state.periodsPerDay;

        const subjectsBySemester = {};
        state.subjects.forEach(subject => {
            if (!subjectsBySemester[subject.semester])
                subjectsBySemester[subject.semester] = [];
            subjectsBySemester[subject.semester].push(subject);
        });

        state.routines = {};
        let allSuccess = true;

        Object.keys(subjectsBySemester).forEach(semester => {
            const semSubjects = subjectsBySemester[semester];

            // Each double-period class uses 2 slots; single uses 1
            const totalSlotsNeeded = semSubjects.reduce((sum, s) =>
                sum + (s.doublePeriod ? s.classes * 2 : s.classes), 0);
            const availableSlots = days * (periods - 1); // minus 1 lunch per day

            if (totalSlotsNeeded > availableSlots) {
                allSuccess = false;
                Swal.fire('Error',
                    `${semester}: needs ${totalSlotsNeeded} slots but only ${availableSlots} available.`,
                    'error');
                return;
            }

            // ── Build routine grid ────────────────────────────────────────────
            const routine = Array(days).fill(null).map(() => Array(periods).fill(null));
            for (let d = 0; d < days; d++) routine[d][3] = { lunch: true };

            // ── Separate into double and single pools ─────────────────────────
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
                    semester: semester,
                    doublePeriod: !!subject.doublePeriod
                };
                for (let i = 0; i < subject.classes; i++) {
                    if (subject.doublePeriod) doublePool.push({ ...entry });
                    else singlePool.push({ ...entry });
                }
            });

            shuffleArray(singlePool);
            shuffleArray(doublePool);

            // ── Place double-period classes first ─────────────────────────────
            // Valid consecutive pairs per day (never across lunch period 3):
            // (0,1), (1,2), (4,5), (5,6)
            const allDoublePairs = [];
            for (let d = 0; d < days; d++) {
                [[0, 1], [1, 2], [4, 5], [5, 6]].forEach(([p1, p2]) => {
                    allDoublePairs.push([d, p1, p2]);
                });
            }
            shuffleArray(allDoublePairs);

            for (const cls of doublePool) {
                let placed = false;
                for (const [d, p1, p2] of allDoublePairs) {
                    if (routine[d][p1] === null && routine[d][p2] === null) {
                        routine[d][p1] = { ...cls };
                        routine[d][p2] = { ...cls, continued: true }; // 2nd period marker
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    // No double slot available — fall back to single
                    singlePool.push({ ...cls, doublePeriod: false });
                }
            }

            // ── Place single-period classes, round-robin across days ───────────
            // period-first order so every day gets 1 class before any day gets 2
            const orderedSlots = [];
            for (let p = 0; p < periods; p++) {
                if (p === 3) continue;
                for (let d = 0; d < days; d++) {
                    orderedSlots.push([d, p]);
                }
            }

            const teacherLastPeriod = {};
            let sIdx = 0;

            for (const [day, period] of orderedSlots) {
                if (routine[day][period] !== null) continue; // already filled
                if (sIdx >= singlePool.length) continue;     // no more classes

                let cls = singlePool[sIdx];

                // Avoid same teacher consecutive periods on same day
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

                routine[day][period] = cls;
                if (cls.teacherId) {
                    teacherLastPeriod[`${cls.teacherId}_${day}`] = period;
                }
                sIdx++;
            }

            state.routines[semester] = routine;
        });

        if (allSuccess) {
            renderRoutine();
            updateSummary();
            showLoader(false);
            Swal.fire('Success!', 'Routines generated for all semesters successfully', 'success');
        } else {
            showLoader(false);
        }
    }, 1000);
}

// ── Export to Excel ───────────────────────────────────────────────────────────

function exportToExcel() {
    if (Object.keys(state.routines).length === 0) {
        Swal.fire('Error', 'No routine to export', 'error');
        return;
    }

    const timeSlots = [
        '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00',
        '01:00 - 02:00', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00'
    ];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let csv = '\uFEFF';
    Object.keys(state.routines).forEach(semester => {
        const routine = state.routines[semester];
        csv += `${semester}\n`;
        csv += 'Day/Period';
        for (let p = 1; p <= state.periodsPerDay; p++) {
            csv += `,Period ${p} (${timeSlots[p - 1]})`;
        }
        csv += '\n';
        for (let d = 0; d < state.days; d++) {
            csv += dayNames[d];
            for (let p = 0; p < state.periodsPerDay; p++) {
                const cls = routine[d][p];
                if (cls && cls.lunch) csv += ',LUNCH';
                else if (cls && cls.continued) csv += ',↑ (cont.)';
                else if (cls) csv += `,"${cls.subjectName} (${cls.subjectCode}) - ${cls.teacherName}${cls.division ? ' [' + cls.division + ']' : ''}"`;
                else csv += ',Free';
            }
            csv += '\n';
        }
        csv += '\n\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-map-excel-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Excel file exported!', showConfirmButton: false, timer: 2500 });
}