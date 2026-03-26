// Course-wise subjects with hierarchical structure
const courseSubjects = {
    diploma: {
        '1st Year': {
            'Semester I': [
                { name: 'Engineering Mathematics-I', code: 'BSC101', credits: 4 },
                { name: 'Engineering Physics', code: 'BSC102', credits: 3 },
                { name: 'Engineering Chemistry', code: 'BSC103', credits: 3 },
                { name: 'Engineering Graphics', code: 'ESC104', credits: 3 },
                { name: 'Basic Electrical Engineering', code: 'ESC105', credits: 3 },
                { name: 'Programming for Problem Solving', code: 'ESC106', credits: 3 },
                { name: 'Physics Lab', code: 'BSC107', credits: 1 },
                { name: 'Chemistry Lab', code: 'BSC108', credits: 1 },
                { name: 'Engineering Workshop', code: 'ESC109', credits: 2 }
            ]
        },
        '2nd Year': {
            'Semester III': [
                { name: 'Data Structures', code: 'CSPC301', credits: 4 },
                { name: 'Digital Electronics', code: 'CSPC302', credits: 3 },
                { name: 'Computer Organization', code: 'CSPC303', credits: 3 },
                { name: 'Discrete Mathematics', code: 'CSPC304', credits: 3 },
                { name: 'Operating Systems', code: 'CSPC305', credits: 4 },
                { name: 'Data Structures Lab', code: 'CSPC306', credits: 2 },
                { name: 'Digital Electronics Lab', code: 'CSPC307', credits: 1 },
                { name: 'Technical Communication', code: 'HSS308', credits: 2 }
            ]
        },
        '3rd Year': {
            'Semester V': [
                { name: 'Introduction to e-Governance', code: 'CSPC501', credits: 3 },
                { name: 'Internet of Things (IoT)', code: 'CSPC502', credits: 3 },
                { name: 'Web Technologies', code: 'CSPC503', credits: 3 },
                { name: 'Networking Lab', code: 'CSPC504', credits: 2 },
                { name: 'Web Technology Lab', code: 'CSPC505', credits: 2 },
                { name: 'Distributed Systems', code: 'CSPE506-A', credits: 3 },
                { name: 'Software Testing', code: 'CSPE507-B', credits: 3 },
                { name: 'Introduction to Embedded System', code: 'ECOE508', credits: 3 },
                { name: 'Project Part-I', code: 'CSPR510', credits: 6 }
            ]
        }
    },
    btech: {}
};

const facultyBySemester = {
    'Semester I': {
        'Division A': [
            'Dr. Rajesh Kumar', 'Prof. Anita Sharma', 'Dr. Vikram Singh',
            'Prof. Meena Gupta', 'Dr. Suresh Rao', 'Prof. Priya Verma'
        ],
        'Division B': [
            'Dr. Amit Patel', 'Prof. Sunita Reddy', 'Dr. Manish Joshi',
            'Prof. Kavita Nair', 'Dr. Arun Kumar', 'Prof. Deepa Menon'
        ]
    },
    'Semester III': {
        'Division A': [
            'Dr. Ramesh Babu', 'Prof. Lakshmi Iyer', 'Dr. Karthik Rao',
            'Prof. Swati Desai', 'Dr. Naveen Kumar', 'Prof. Anjali Patil'
        ],
        'Division B': [
            'Dr. Sanjay Mehta', 'Prof. Pooja Agarwal', 'Dr. Ravi Shankar',
            'Prof. Nisha Kapoor', 'Dr. Dinesh Kulkarni', 'Prof. Rashmi Jain'
        ]
    },
    'Semester V': {
        'Division A': [
            'Arpita Banik', 'Biswaraj Roy', 'Purbani Kar', 'Nabanita Shil',
            'Prasenjit Das', 'Deeptanu Choudhury', 'Barnali Chowdhury'
        ],
        'Division B': [
            'Tina Debbarma', 'Sourav Deb', 'Ankita Bhattacharjee',
            'Priyanka Majumder', 'Kankan Saha', 'Sayan Saha', 'Puspanjali Debnath'
        ]
    }
};

const timeSlots = [
    '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00',
    '01:00 - 02:00', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00',
    '05:00 - 06:00', '06:00 - 07:00'
];

let state = {
    subjects: [], teachers: [], routines: {},
    days: 5, periodsPerDay: 7, history: [],
    selectedCourse: '', selectedSemester: '', printView: 'all'
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const semesterOrder = ['Semester I', 'Semester III', 'Semester V'];

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    updateUI();
    attachEventListeners();
    setupCourseDropdown();
});

function updatePrintViewDropdown() {
    const select = document.getElementById('printViewSelect');
    const currentVal = select.value;

    // Rebuild options
    select.innerHTML = '<option value="all">All Semesters Combined</option>';

    const activeSemesters = [
        ...semesterOrder.filter(sem => state.routines[sem]),
        ...Object.keys(state.routines).filter(sem => !semesterOrder.includes(sem))
    ];

    activeSemesters.forEach(sem => {
        const opt = document.createElement('option');
        opt.value = sem;
        opt.textContent = sem;
        select.appendChild(opt);
    });

    // Restore selection if still valid
    if ([...select.options].some(o => o.value === currentVal)) {
        select.value = currentVal;
    }
}

function setupCourseDropdown() {
    const courseSelect = document.getElementById('courseSelect');
    const semesterSelect = document.getElementById('semesterSelect');
    const subjectSelect = document.getElementById('subjectName');
    const classesInput = document.getElementById('subjectClasses');
    const addButton = document.getElementById('addSubject');

    courseSelect.addEventListener('change', (e) => {
        const course = e.target.value;
        state.selectedCourse = course;
        state.selectedSemester = '';

        semesterSelect.innerHTML = '<option value="">Select Semester</option>';
        subjectSelect.innerHTML = '<option value="">First select semester</option>';
        subjectSelect.disabled = true;
        classesInput.disabled = true;
        classesInput.value = 0;
        addButton.disabled = true;

        if (course && courseSubjects[course]) {
            semesterSelect.disabled = false;
            const years = Object.keys(courseSubjects[course]);
            years.forEach(year => {
                const semesters = Object.keys(courseSubjects[course][year]);
                semesters.forEach(semester => {
                    const option = document.createElement('option');
                    option.value = `${year}|${semester}`;
                    option.textContent = `${year} - ${semester}`;
                    semesterSelect.appendChild(option);
                });
            });
        } else {
            semesterSelect.disabled = true;
        }
    });

    semesterSelect.addEventListener('change', (e) => {
        const semesterValue = e.target.value;
        state.selectedSemester = semesterValue;
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        classesInput.value = 0;

        if (semesterValue) {
            const [year, semester] = semesterValue.split('|');
            const subjects = courseSubjects[state.selectedCourse][year][semester];
            const addedCodes = state.subjects.map(s => s.code);
            const availableSubjects = subjects.filter(s => !addedCodes.includes(s.code));

            if (availableSubjects.length > 0) {
                availableSubjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = JSON.stringify({ ...subject, semester });
                    option.textContent = `${subject.name} (${subject.code}) - ${subject.credits} credits`;
                    subjectSelect.appendChild(option);
                });
                subjectSelect.disabled = false;
            } else {
                subjectSelect.innerHTML = '<option value="">All subjects added</option>';
                subjectSelect.disabled = true;
            }
        } else {
            subjectSelect.disabled = true;
            classesInput.disabled = true;
            addButton.disabled = true;
        }
    });

    subjectSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            try {
                const subjectInfo = JSON.parse(e.target.value);
                classesInput.value = subjectInfo.credits;
                classesInput.disabled = false;
                addButton.disabled = false;
            } catch (err) {
                classesInput.disabled = true;
                addButton.disabled = true;
            }
        } else {
            classesInput.value = 0;
            classesInput.disabled = true;
            addButton.disabled = true;
        }
    });
}

function refreshSemesterDropdown() {
    const subjectSelect = document.getElementById('subjectName');
    if (state.selectedSemester) {
        const [year, semester] = state.selectedSemester.split('|');
        const subjects = courseSubjects[state.selectedCourse][year][semester];
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        const addedCodes = state.subjects.map(s => s.code);
        const availableSubjects = subjects.filter(s => !addedCodes.includes(s.code));

        if (availableSubjects.length > 0) {
            availableSubjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = JSON.stringify({ ...subject, semester });
                option.textContent = `${subject.name} (${subject.code}) - ${subject.credits} credits`;
                subjectSelect.appendChild(option);
            });
            subjectSelect.disabled = false;
        } else {
            subjectSelect.innerHTML = '<option value="">All subjects added</option>';
            subjectSelect.disabled = true;
        }
    }
}

function attachEventListeners() {
    document.getElementById('addSubject').addEventListener('click', addSubject);
    document.getElementById('autoGenerate').addEventListener('click', autoGenerateRoutine);
    document.getElementById('clearRoutine').addEventListener('click', clearRoutine);
    document.getElementById('printRoutine').addEventListener('click', printRoutine);
    document.getElementById('exportJSON').addEventListener('click', exportJSON);
    document.getElementById('importJSON').addEventListener('click', () => document.getElementById('jsonFileInput').click());
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('facultyScheduleBtn').addEventListener('click', showFacultyScheduleOptions);
    document.getElementById('jsonFileInput').addEventListener('change', importJSON);
    document.getElementById('saveBtn').addEventListener('click', saveToStorage);
    document.getElementById('loadBtn').addEventListener('click', () => {
        loadFromStorage();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Data loaded', showConfirmButton: false, timer: 2500 });
    });
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('footerExport').addEventListener('click', (e) => { e.preventDefault(); exportJSON(); });
    document.getElementById('footerImport').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('jsonFileInput').click(); });
    document.getElementById('footerFaculty').addEventListener('click', (e) => { e.preventDefault(); showFacultyScheduleOptions(); });
    document.getElementById('daysSelect').addEventListener('change', (e) => {
        state.days = parseInt(e.target.value);
        if (Object.keys(state.routines).length > 0) { state.routines = {}; renderRoutine(); }
    });
    document.getElementById('periodsPerDay').addEventListener('change', (e) => {
        state.periodsPerDay = parseInt(e.target.value);
        if (Object.keys(state.routines).length > 0) { state.routines = {}; renderRoutine(); }
    });
    document.getElementById('printViewSelect').addEventListener('change', (e) => state.printView = e.target.value);
}

function saveHistory() {
    state.history.push(JSON.stringify({ subjects: state.subjects, teachers: state.teachers, routines: state.routines }));
    if (state.history.length > 20) state.history.shift();
}

function undo() {
    if (state.history.length === 0) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Nothing to undo', showConfirmButton: false, timer: 2000 });
        return;
    }
    const prev = JSON.parse(state.history.pop());
    state.subjects = prev.subjects;
    state.teachers = prev.teachers;
    state.routines = prev.routines;
    updateUI();
    refreshSemesterDropdown();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Undone!', showConfirmButton: false, timer: 2000 });
}

function addSubject() {
    const course = state.selectedCourse;
    const subjectData = document.getElementById('subjectName').value.trim();
    let classes = parseInt(document.getElementById('subjectClasses').value);

    if (!course) { Swal.fire('Error', 'Please select a course', 'error'); return; }
    if (!subjectData) { Swal.fire('Error', 'Please select subject', 'error'); return; }

    let subjectInfo;
    try { subjectInfo = JSON.parse(subjectData); }
    catch (e) { Swal.fire('Error', 'Invalid subject data', 'error'); return; }

    if (classes < 0 || classes > 40) { Swal.fire('Error', 'Classes per week must be between 0 and 40', 'error'); return; }

    saveHistory();
    state.subjects.push({
        id: Date.now(), course, name: subjectInfo.name, code: subjectInfo.code,
        credits: subjectInfo.credits, semester: subjectInfo.semester, classes: classes,
        facultyId: null, facultyName: null, division: null
    });

    document.getElementById('subjectClasses').value = 0;
    updateUI();
    refreshSemesterDropdown();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `${subjectInfo.name} added!`, showConfirmButton: false, timer: 2000 });
}

function deleteSubject(id) {
    Swal.fire({ title: 'Delete subject?', text: 'This will also remove assigned faculty', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete' })
        .then((result) => {
            if (result.isConfirmed) {
                saveHistory();
                const subject = state.subjects.find(s => s.id === id);
                if (subject && subject.facultyId) state.teachers = state.teachers.filter(t => t.id !== subject.facultyId);
                state.subjects = state.subjects.filter(s => s.id !== id);
                state.routines = {};
                updateUI();
                refreshSemesterDropdown();
                Swal.fire('Deleted!', '', 'success');
            }
        });
}

function handleFacultyChange(subjectId, selectElement) {
    const value = selectElement.value;
    if (!value) return;

    const [division, facultyName] = value.split('|');
    saveHistory();

    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    if (subject.facultyId) {
        const existingTeacher = state.teachers.find(t => t.id === subject.facultyId);
        if (existingTeacher) { existingTeacher.name = facultyName; existingTeacher.division = division; }
        subject.facultyName = facultyName;
        subject.division = division;
    } else {
        const teacherId = Date.now();
        state.teachers.push({ id: teacherId, name: facultyName, division: division, subjectId: subjectId, subjectName: subject.name, semester: subject.semester });
        subject.facultyId = teacherId;
        subject.facultyName = facultyName;
        subject.division = division;
    }

    state.routines = {};
    updateUI();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `${facultyName} (${division}) assigned!`, showConfirmButton: false, timer: 2000 });
}

function updateUI() {
    renderSubjectsTable();
    renderRoutine();
    updateSummary();
}

function renderSubjectsTable() {
    const tbody = document.querySelector('#subjectsTable tbody');
    tbody.innerHTML = '';

    state.subjects.forEach(subject => {
        const teacher = state.teachers.find(t => t.id === subject.facultyId);
        const row = document.createElement('tr');

        let facultyDropdown = '<select class="faculty-dropdown" onchange="handleFacultyChange(' + subject.id + ', this)">';
        facultyDropdown += '<option value="">Select Faculty</option>';

        let semesterFaculty = facultyBySemester[subject.semester];

        if (!semesterFaculty) {
            const s = subject.semester.toLowerCase();
            let matchKey = null;
            if (s.includes('1st') || s.includes('sem i')) matchKey = 'Semester I';
            else if (s.includes('3rd') || s.includes('sem iii')) matchKey = 'Semester III';
            else if (s.includes('5th') || s.includes('sem v')) matchKey = 'Semester V';
            semesterFaculty = matchKey ? facultyBySemester[matchKey] : null;
        }

        if (semesterFaculty) {
            Object.keys(semesterFaculty).forEach(division => {
                facultyDropdown += `<optgroup label="${division}">`;
                semesterFaculty[division].forEach(faculty => {
                    const value = `${division}|${faculty}`;
                    const selected = (teacher && teacher.name === faculty && teacher.division === division) ? 'selected' : '';
                    facultyDropdown += `<option value="${value}" ${selected}>${faculty}</option>`;
                });
                facultyDropdown += '</optgroup>';
            });
        }
        facultyDropdown += '</select>';

        row.innerHTML = `
      <td><strong>${subject.course.toUpperCase()}</strong><br><span style="font-size:11px; color:#6b7280">${subject.semester}</span></td>
      <td><strong>${subject.name}</strong><br><span style="font-size:11px; color:#6b7280">${subject.code} | Credits: ${subject.credits}</span></td>
      <td>${subject.classes}</td>
      <td>${facultyDropdown}</td>
      <td><button class="secondary" onclick="deleteSubject(${subject.id})">Delete</button></td>
    `;
        tbody.appendChild(row);
    });

    if (state.subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="muted" style="text-align: center; padding: 30px;">No subjects added yet. Start by selecting a course and semester above.</td></tr>';
    }
}

function updateSummary() {
    document.getElementById('summarySubjects').textContent = state.subjects.length;
    document.getElementById('summaryTeachers').textContent = state.teachers.length;
    document.getElementById('summaryClasses').textContent = state.subjects.reduce((sum, s) => sum + s.classes, 0);
    document.getElementById('summaryStatus').textContent = Object.keys(state.routines).length > 0 ? 'Generated' : 'Not Generated';
}

function autoGenerateRoutine() {
    if (state.subjects.length === 0) { Swal.fire('Error', 'Please add subjects first', 'error'); return; }

    const unassignedSubjects = state.subjects.filter(s => !s.facultyId);
    if (unassignedSubjects.length > 0) {
        Swal.fire({ title: 'Warning', text: `${unassignedSubjects.length} subject(s) have no assigned faculty. Continue anyway?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, continue' })
            .then((result) => { if (result.isConfirmed) generateRoutineLogic(); });
    } else {
        generateRoutineLogic();
    }
}

function generateRoutineLogic() {
    showLoader(true);
    saveHistory();

    setTimeout(() => {
        const days = state.days;
        const periods = state.periodsPerDay;
        const totalSlots = days * periods;

        const subjectsBySemester = {};
        state.subjects.forEach(subject => {
            if (!subjectsBySemester[subject.semester])
                subjectsBySemester[subject.semester] = [];
            subjectsBySemester[subject.semester].push(subject);
        });

        state.routines = {};
        let allSuccess = true;

        Object.keys(subjectsBySemester).forEach(semester => {
            const semesterSubjects = subjectsBySemester[semester];
            const totalRequired = semesterSubjects.reduce((sum, s) => sum + s.classes, 0);

            if (totalRequired > totalSlots - days) {
                allSuccess = false;
                Swal.fire('Error', `${semester}: Total required classes (${totalRequired}) exceed available slots`, 'error');
                return;
            }

            // Build class pool
            const classPool = [];
            semesterSubjects.forEach(subject => {
                for (let i = 0; i < subject.classes; i++) {
                    const teacher = state.teachers.find(t => t.id === subject.facultyId);
                    classPool.push({
                        subjectId: subject.id,
                        subjectName: subject.name,
                        subjectCode: subject.code,
                        teacherId: teacher ? teacher.id : null,
                        teacherName: teacher ? teacher.name : 'Unassigned',
                        division: teacher ? teacher.division : null,
                        semester: semester
                    });
                }
            });

            shuffleArray(classPool);

            // ── KEY FIX: distribute evenly across days ──────────────────
            // Build a list of (day, period) slots sorted so we visit
            // each day once before revisiting — round-robin by day index
            const orderedSlots = [];
            for (let p = 0; p < periods; p++) {
                for (let d = 0; d < days; d++) {
                    if (p === 3) continue; // skip lunch period
                    orderedSlots.push([d, p]);
                }
            }
            // orderedSlots is now: [d0p0, d1p0, d2p0...d5p0, d0p1, d1p1...]
            // This ensures every day gets a class before any day gets a second one

            const routine = Array(days).fill(null).map(() => Array(periods).fill(null));

            // Set lunch for all days
            for (let d = 0; d < days; d++) {
                routine[d][3] = { lunch: true };
            }

            const teacherLastDay = {}; // track which day teacher last taught to avoid same-day conflicts

            let classIndex = 0;
            for (const [day, period] of orderedSlots) {
                if (classIndex >= classPool.length) break;

                let selectedClass = classPool[classIndex];
                let attempts = 0;

                // Try to avoid same teacher back-to-back on same day
                while (attempts < 5 && selectedClass.teacherId) {
                    const key = `${selectedClass.teacherId}_${day}`;
                    const lastPeriod = teacherLastDay[key];
                    if (lastPeriod !== undefined && lastPeriod === period - 1) {
                        const altIndex = classIndex + 1 + Math.floor(Math.random() * (classPool.length - classIndex - 1));
                        if (altIndex < classPool.length) {
                            [classPool[classIndex], classPool[altIndex]] = [classPool[altIndex], classPool[classIndex]];
                            selectedClass = classPool[classIndex];
                        }
                    } else break;
                    attempts++;
                }

                routine[day][period] = selectedClass;
                if (selectedClass.teacherId) {
                    teacherLastDay[`${selectedClass.teacherId}_${day}`] = period;
                }
                classIndex++;
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function clearRoutine() {
    Swal.fire({ title: 'Clear routine?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, clear' })
        .then((result) => {
            if (result.isConfirmed) {
                saveHistory();
                state.routines = {};
                renderRoutine();
                updateSummary();
                Swal.fire('Cleared!', '', 'success');
            }
        });
}

// FIXED: Combined table rendering (like screenshot)
function renderRoutine() {
    const wrapper = document.getElementById('timetableWrapper');

    if (Object.keys(state.routines).length === 0) {
        wrapper.innerHTML = '<p class="muted" style="text-align: center;">No routine generated yet. Add subjects and click "Generate All Semesters"</p>';
        wrapper.style.background = '#f8fafc';
        wrapper.style.padding = '20px';
        return;
    }

    wrapper.style.background = 'transparent';
    wrapper.style.padding = '0';

    const periods = state.periodsPerDay;
    const days = state.days;
    const activeSemesters = [
        ...semesterOrder.filter(sem => state.routines[sem]),       // original flow
        ...Object.keys(state.routines).filter(sem => !semesterOrder.includes(sem)) // excel import
    ];

    let html = '<div id="routineTableContainer">';
    html += '<table id="routineTable" style="width: 100%;"><thead><tr>';

    // Header row with Day, Semester, and Period columns
    html += '<th style="vertical-align: middle; background: #1e40af; color: white;">Day</th>';
    html += '<th style="vertical-align: middle; background: #1e40af; color: white;">Semester</th>';

    for (let p = 1; p <= periods; p++) {
        if (p === 4) {
            html += `<th style="background: #1e40af; color: white; font-size: 11px; padding: 8px;">LUNCH<br><span style="font-size: 9px;">${timeSlots[p - 1]}</span></th>`;
        } else {
            html += `<th style="background: #1e40af; color: white; font-size: 11px; padding: 8px;">Period ${p}<br><span style="font-size: 9px;">${timeSlots[p - 1]}</span></th>`;
        }
    }

    html += '</tr></thead><tbody>';

    // Rows grouped by day, then by semester
    for (let d = 0; d < days; d++) {
        activeSemesters.forEach((semester, semIndex) => {
            const routine = state.routines[semester];
            html += '<tr>';

            // Day name cell (with rowspan on first semester)
            if (semIndex === 0) {
                html += `<th rowspan="${activeSemesters.length}" style="background: #dbeafe; color: #1e40af; font-weight: 700; font-size: 14px; border-right: 2px solid #1e40af; vertical-align: middle;">${dayNames[d]}</th>`;
            }

            // Semester label cell (separate column)
            html += `<th style="background: #eff6ff; color: #1e40af; font-weight: 600; font-size: 11px; padding: 8px; text-align: center; border-right: 2px solid #cbd5e1;">${semester}</th>`;

            // Period cells for this semester
            for (let p = 0; p < periods; p++) {
                const cls = routine[d][p];

                if (cls && cls.lunch) {
                    html += `<td class="lunch-period semester-col" data-semester="${semester}" style="background: #fef3c7; color: #92400e; font-weight: 700; font-size: 9px; text-align: center;">LUNCH</td>`;
                } else if (cls && cls.continued) {
                    // 2nd period of a double-period lab — show continuation
                    html += `<td class="semester-col" data-semester="${semester}" 
              style="background: #dcfce7; font-size: 9px; text-align:center; color:#166534; font-style:italic;">
              ↑ continued class 
             </td>`;
                } else if (cls) {
                    const bg = cls.doublePeriod ? 'background:#dcfce7;' : '';
                    html += `<td class="semester-col" data-semester="${semester}" 
              onclick="editCell('${semester}', ${d}, ${p})" 
              style="cursor:pointer; font-size:10px; padding:6px; ${bg}">
        <strong style="display:block; margin-bottom:2px; color:#1e40af; font-size:9px;">${cls.subjectName}</strong>
        <span style="font-size:8px; color:#059669; font-weight:600;">${cls.teacherName}</span>
    </td>`;
                } else {
                    html += `<td class="semester-col" data-semester="${semester}" onclick="editCell('${semester}', ${d}, ${p})" style="color: #9ca3af; font-size: 9px; cursor: pointer; text-align: center;">Doubt class</td>`;
                }
            }

            html += '</tr>';
        });
    }

    html += '</tbody></table></div>';
    wrapper.innerHTML = html;
    updatePrintViewDropdown()
}

function editCell(semester, day, period) {
    if (!state.routines[semester] || period === 3) return;
    const options = {};
    options['Free'] = null;
    const semesterSubjects = state.subjects.filter(s => s.semester === semester);

    semesterSubjects.forEach(subject => {
        const teacher = state.teachers.find(t => t.id === subject.facultyId);
        const teacherName = teacher ? teacher.name : 'Unassigned';
        const division = teacher ? ` (${teacher.division})` : '';
        options[`${subject.name} (${teacherName}${division})`] = {
            subjectId: subject.id, subjectName: subject.name, subjectCode: subject.code,
            teacherId: teacher ? teacher.id : null, teacherName: teacherName,
            division: teacher ? teacher.division : null, semester: semester
        };
    });

    Swal.fire({
        title: `${semester} - ${dayNames[day]} - ${timeSlots[period]}`,
        input: 'select', inputOptions: Object.keys(options),
        showCancelButton: true, confirmButtonText: 'Update'
    }).then((result) => {
        if (result.isConfirmed) {
            saveHistory();
            state.routines[semester][day][period] = Object.values(options)[result.value];
            renderRoutine();
            Swal.fire('Updated!', '', 'success');
        }
    });
}

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

function saveToStorage() {
    const data = { subjects: state.subjects, teachers: state.teachers, routines: state.routines, days: state.days, periodsPerDay: state.periodsPerDay };
    try {
        localStorage.setItem('lectureMapData', JSON.stringify(data));
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Data saved successfully', showConfirmButton: false, timer: 2500 });
    } catch (e) {
        Swal.fire('Error', 'Failed to save data to storage', 'error');
    }
}

function loadFromStorage() {
    try {
        const data = localStorage.getItem('lectureMapData');
        if (data) {
            const parsed = JSON.parse(data);
            state.subjects = parsed.subjects || [];
            state.teachers = parsed.teachers || [];
            state.routines = parsed.routines || {};
            state.days = parsed.days || 5;
            state.periodsPerDay = parsed.periodsPerDay || 7;
            document.getElementById('daysSelect').value = state.days;
            document.getElementById('periodsPerDay').value = state.periodsPerDay;
            updateUI();
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
    }
}

function clearAll() {
    Swal.fire({ title: 'Reset Everything?', text: 'This will delete all subjects, faculty, and routines', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, reset all', confirmButtonColor: '#d33' })
        .then((result) => {
            if (result.isConfirmed) {
                saveHistory();
                state.subjects = [];
                state.teachers = [];
                state.routines = {};
                state.selectedCourse = '';
                state.selectedSemester = '';
                document.getElementById('courseSelect').value = '';
                document.getElementById('semesterSelect').innerHTML = '<option value="">First select course</option>';
                document.getElementById('semesterSelect').disabled = true;
                document.getElementById('subjectName').innerHTML = '<option value="">First select semester</option>';
                document.getElementById('subjectName').disabled = true;
                document.getElementById('subjectClasses').value = 0;
                document.getElementById('subjectClasses').disabled = true;
                document.getElementById('addSubject').disabled = true;
                updateUI();
                Swal.fire('Reset!', 'All data has been cleared', 'success');
            }
        });
}

// FIXED: Print function with proper semester filtering
function printRoutine() {
    if (Object.keys(state.routines).length === 0) {
        Swal.fire('Error', 'No routine to print', 'error');
        return;
    }

    const printView = state.printView;

    // Show/hide columns based on selection
    const allCols = document.querySelectorAll('.semester-col');

    if (printView === 'all') {
        // Show all columns
        allCols.forEach(col => col.style.display = '');
    } else {
        // Hide non-selected semester columns
        allCols.forEach(col => {
            const colSemester = col.getAttribute('data-semester');
            if (colSemester === printView) {
                col.style.display = '';
            } else {
                col.style.display = 'none';
            }
        });
    }

    // Print
    window.print();

    // Restore all columns after print
    setTimeout(() => {
        allCols.forEach(col => col.style.display = '');
    }, 1000);
}

function exportJSON() {
    const data = { subjects: state.subjects, teachers: state.teachers, routines: state.routines, days: state.days, periodsPerDay: state.periodsPerDay, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-map-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'JSON exported successfully', showConfirmButton: false, timer: 2500 });
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            saveHistory();
            state.subjects = data.subjects || [];
            state.teachers = data.teachers || [];
            state.routines = data.routines || {};
            state.days = data.days || 5;
            state.periodsPerDay = data.periodsPerDay || 8;
            document.getElementById('daysSelect').value = state.days;
            document.getElementById('periodsPerDay').value = state.periodsPerDay;
            updateUI();
            Swal.fire('Success!', 'Data imported successfully', 'success');
        } catch (err) {
            Swal.fire('Error', 'Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function exportCSV() {
    if (Object.keys(state.routines).length === 0) { Swal.fire('Error', 'No routine to export', 'error'); return; }
    let csv = '';
    Object.keys(state.routines).forEach(semester => {
        const routine = state.routines[semester];
        const days = state.days;
        const periods = state.periodsPerDay;
        csv += `\n${semester}\n`;
        csv += 'Day/Period';
        for (let p = 1; p <= periods; p++) csv += `,Period ${p} (${timeSlots[p - 1]})`;
        csv += '\n';
        for (let d = 0; d < days; d++) {
            csv += dayNames[d];
            for (let p = 0; p < periods; p++) {
                const cls = routine[d][p];
                if (cls && cls.lunch) csv += ',LUNCH';
                else if (cls) csv += `,"${cls.subjectName} - ${cls.teacherName}${cls.division ? ' (' + cls.division + ')' : ''}"`;
                else csv += ',Free';
            }
            csv += '\n';
        }
        csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-map-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'CSV exported successfully', showConfirmButton: false, timer: 2500 });
}

//Faculty Schedule Download

function showFacultyScheduleOptions() {
    console.log('Faculty button clicked'); // Debug

    if (Object.keys(state.routines).length === 0) {
        Swal.fire('Error', 'Please generate routine first', 'error');
        return;
    }

    if (state.teachers.length === 0) {
        Swal.fire('Error', 'No faculty assigned yet', 'error');
        return;
    }

    // Build unique faculty list with all their info
    const uniqueFaculty = {};

    state.teachers.forEach(teacher => {
        const key = teacher.name + '___' + teacher.division; // Unique key

        if (!uniqueFaculty[key]) {
            uniqueFaculty[key] = {
                name: teacher.name,
                division: teacher.division,
                subjects: [],
                id: key
            };
        }

        const subject = state.subjects.find(s => s.id === teacher.subjectId);
        if (subject) {
            uniqueFaculty[key].subjects.push({
                name: subject.name,
                code: subject.code,
                semester: subject.semester
            });
        }
    });

    console.log('Unique Faculty:', uniqueFaculty); // Debug

    // Create dropdown options
    const facultyList = Object.values(uniqueFaculty);
    const facultyOptions = {};

    facultyList.forEach((faculty, index) => {
        facultyOptions[index] = `${faculty.name} (${faculty.division})`;
    });

    console.log('Faculty Options:', facultyOptions); // Debug

    // Show selection dialog
    Swal.fire({
        title: '👨‍🏫 Select Faculty Member',
        html: `
      <select id="facultySelector" class="swal2-input" style="width: 80%; padding: 10px; font-size: 16px;">
        <option value="">-- Choose Faculty --</option>
        ${facultyList.map((faculty, index) =>
            `<option value="${index}">${faculty.name} (${faculty.division})</option>`
        ).join('')}
      </select>
    `,
        showCancelButton: true,
        confirmButtonText: 'Generate Schedule',
        preConfirm: () => {
            const selectedIndex = document.getElementById('facultySelector').value;
            if (!selectedIndex) {
                Swal.showValidationMessage('Please select a faculty member');
                return false;
            }
            return selectedIndex;
        }
    }).then((result) => {
        if (result.isConfirmed && result.value !== undefined && result.value !== '') {
            const selectedIndex = parseInt(result.value);
            const selectedFaculty = facultyList[selectedIndex];

            console.log('Selected Faculty:', selectedFaculty); // Debug

            if (selectedFaculty) {
                generateFacultySchedule(selectedFaculty);
            } else {
                Swal.fire('Error', 'Invalid faculty selection', 'error');
            }
        }
    });
}

// Generate Faculty Schedule
function generateFacultySchedule(faculty) {
    console.log('Generating schedule for:', faculty); // Debug

    showLoader(true);

    setTimeout(() => {
        // Collect all classes for this faculty
        const facultySchedule = {};
        let totalClasses = 0;

        Object.keys(state.routines).forEach(semester => {
            const routine = state.routines[semester];

            for (let d = 0; d < state.days; d++) {
                for (let p = 0; p < state.periodsPerDay; p++) {
                    const cls = routine[d][p];

                    // Check if this class belongs to the selected faculty
                    if (cls && !cls.lunch &&
                        cls.teacherName === faculty.name &&
                        cls.division === faculty.division) {

                        // Initialize semester schedule if not exists
                        if (!facultySchedule[semester]) {
                            facultySchedule[semester] = Array(state.days)
                                .fill(null)
                                .map(() => Array(state.periodsPerDay).fill(null));
                        }

                        facultySchedule[semester][d][p] = cls;
                        totalClasses++;
                    }
                }
            }
        });

        console.log('Faculty Schedule:', facultySchedule); // Debug
        console.log('Total Classes:', totalClasses); // Debug

        if (totalClasses === 0) {
            showLoader(false);
            Swal.fire('No Classes', `${faculty.name} has no classes assigned in the generated routine.`, 'info');
            return;
        }

        // Generate HTML for the report
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${faculty.name} - Teaching Schedule</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .header { 
      background: linear-gradient(135deg, #1e40af, #2563eb); 
      color: white; 
      padding: 40px; 
      text-align: center;
    }
    
    .header h1 { 
      font-size: 32px; 
      margin-bottom: 10px; 
      font-weight: 700;
    }
    
    .header p { 
      font-size: 18px; 
      opacity: 0.95; 
    }
    
    .content {
      padding: 30px;
    }
    
    .info-box { 
      background: #f0f9ff; 
      padding: 25px; 
      border-radius: 12px; 
      margin-bottom: 30px; 
      border-left: 5px solid #2563eb;
    }
    
    .info-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 20px; 
      margin-top: 15px;
    }
    
    .info-item { 
      text-align: center;
    }
    
    .info-label { 
      font-size: 12px; 
      color: #6b7280; 
      text-transform: uppercase; 
      font-weight: 600; 
      margin-bottom: 8px; 
      letter-spacing: 1px;
    }
    
    .info-value { 
      font-size: 28px; 
      color: #1e40af; 
      font-weight: 700; 
    }
    
    .subjects-list {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      border: 2px solid #e5e7eb;
    }
    
    .subjects-list h3 {
      color: #1e40af;
      margin-bottom: 15px;
      font-size: 20px;
    }
    
    .subjects-list ul {
      list-style: none;
      padding: 0;
    }
    
    .subjects-list li {
      padding: 12px;
      background: #f9fafb;
      margin-bottom: 10px;
      border-radius: 8px;
      border-left: 4px solid #10b981;
      font-size: 14px;
    }
    
    .semester-section { 
      background: white; 
      padding: 25px; 
      border-radius: 12px; 
      margin-bottom: 30px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
    }
    
    .semester-title { 
      font-size: 22px; 
      color: #1e40af; 
      margin-bottom: 20px; 
      padding-bottom: 12px; 
      border-bottom: 3px solid #2563eb; 
      font-weight: 700;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 15px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    th, td { 
      border: 1px solid #cbd5e1; 
      padding: 14px 10px; 
      text-align: center; 
      font-size: 13px;
    }
    
    th { 
      background: #1e40af; 
      color: white; 
      font-weight: 600; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
    }
    
    td { 
      background: white; 
    }
    
    .class-cell { 
      background: #dbeafe !important; 
      font-weight: 600; 
      color: #1e40af; 
    }
    
    .class-cell strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }
    
    .class-cell small {
      color: #6b7280;
      font-size: 11px;
    }
    
    .lunch-cell { 
      background: #fef3c7 !important; 
      color: #92400e; 
      font-weight: 700; 
      font-size: 14px;
    }
    
    .free-cell { 
      background: #f1f5f9 !important; 
      color: #94a3b8; 
      font-style: italic;
    }
    
    .time-slot { 
      font-size: 10px; 
      color: #6b7280; 
      display: block; 
      margin-bottom: 6px; 
      font-weight: 500;
    }
    
    .footer { 
      text-align: center; 
      margin-top: 40px; 
      padding: 25px; 
      color: #6b7280; 
      font-size: 14px; 
      background: #f9fafb;
      border-radius: 12px;
    }
    
    .print-btn {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      color: white;
      padding: 15px 40px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      transition: all 0.3s ease;
      margin-top: 20px;
    }
    
    .print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
    }
    
    @media print { 
      body { 
        background: white; 
        padding: 0;
      } 
      .no-print { 
        display: none !important; 
      }
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Teaching Schedule Report</h1>
      <p>Faculty: <strong>${faculty.name}</strong> | Division: <strong>${faculty.division}</strong></p>
    </div>

    <div class="content">
      <div class="info-box">
        <h3 style="color: #1e40af; margin-bottom: 15px; font-size: 18px;">📊 Summary</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Faculty Name</div>
            <div class="info-value" style="font-size: 20px;">${faculty.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Division</div>
            <div class="info-value" style="font-size: 20px;">${faculty.division}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Subjects Teaching</div>
            <div class="info-value">${faculty.subjects.length}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total Classes/Week</div>
            <div class="info-value">${totalClasses}</div>
          </div>
        </div>
      </div>

      <div class="subjects-list">
        <h3>📚 Assigned Subjects</h3>
        <ul>`;

        faculty.subjects.forEach(subject => {
            html += `
          <li><strong>${subject.name}</strong> (${subject.code}) - ${subject.semester}</li>`;
        });

        html += `
        </ul>
      </div>`;

        // Generate schedule tables for each semester
        const sortedSemesters = Object.keys(facultySchedule).sort((a, b) => {
            return semesterOrder.indexOf(a) - semesterOrder.indexOf(b);
        });

        sortedSemesters.forEach(semester => {
            const routine = facultySchedule[semester];

            html += `
      <div class="semester-section">
        <div class="semester-title">📅 ${semester}</div>
        <table>
          <thead>
            <tr>
              <th>Day / Time</th>`;

            for (let p = 1; p <= state.periodsPerDay; p++) {
                if (p === 4) {
                    html += `<th>LUNCH<br><span style="font-size:10px; font-weight:400">${timeSlots[p - 1]}</span></th>`;
                } else {
                    html += `<th>Period ${p}<br><span style="font-size:10px; font-weight:400">${timeSlots[p - 1]}</span></th>`;
                }
            }

            html += `
            </tr>
          </thead>
          <tbody>`;

            for (let d = 0; d < state.days; d++) {
                html += `
            <tr>
              <th style="background: #eff6ff; color: #1e40af;">${dayNames[d]}</th>`;

                for (let p = 0; p < state.periodsPerDay; p++) {
                    if (p === 3) {
                        html += `<td class="lunch-cell">🍽️ LUNCH</td>`;
                    } else if (routine[d] && routine[d][p]) {
                        const cls = routine[d][p];
                        html += `
              <td class="class-cell">
                <span class="time-slot">${timeSlots[p]}</span>
                <strong>${cls.subjectName}</strong>
                <small>${cls.subjectCode}</small>
              </td>`;
                    } else {
                        html += `
              <td class="free-cell">
                <span class="time-slot">${timeSlots[p]}</span>
                Free
              </td>`;
                    }
                }

                html += `
            </tr>`;
            }

            html += `
          </tbody>
        </table>
      </div>`;
        });

        html += `
      <div class="footer">
        <p><strong>Lecture Map</strong> - Professional College Routine Management System</p>
        <p style="margin-top: 8px;">Generated on ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })} | TCEA Major Project</p>
      </div>
      
      <div style="text-align: center; padding-bottom: 30px;" class="no-print">
        <button onclick="window.print()" class="print-btn">
          🖨️ Print This Schedule
        </button>
      </div>
    </div>
  </div>
</body>
</html>`;

        // Open in new window
        const newWindow = window.open('', '_blank', 'width=1200,height=800');

        if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();

            showLoader(false);

            Swal.fire({
                icon: 'success',
                title: 'Schedule Generated!',
                html: `<strong>${faculty.name}'s</strong> teaching schedule has been opened in a new window.<br><br>Total Classes: <strong>${totalClasses}</strong>`,
                confirmButtonText: 'OK',
                timer: 4000
            });
        } else {
            showLoader(false);
            Swal.fire({
                icon: 'warning',
                title: 'Pop-up Blocked',
                html: 'Please allow pop-ups for this site to view the faculty schedule.<br><br><small>Look for a pop-up blocker icon in your browser address bar.</small>',
                confirmButtonText: 'OK'
            });
        }
    }, 500);
}

// FIXED: Generate Faculty Schedule
function generateFacultySchedule(faculty) {
    showLoader(true);

    setTimeout(() => {
        const facultySchedule = {};

        Object.keys(state.routines).forEach(semester => {
            const routine = state.routines[semester];
            for (let d = 0; d < state.days; d++) {
                for (let p = 0; p < state.periodsPerDay; p++) {
                    const cls = routine[d][p];
                    if (cls && !cls.lunch && cls.teacherName === faculty.name && cls.division === faculty.division) {
                        if (!facultySchedule[semester]) {
                            facultySchedule[semester] = Array(state.days).fill(null).map(() => Array(state.periodsPerDay).fill(null));
                        }
                        facultySchedule[semester][d][p] = cls;
                    }
                }
            }
        });

        let html = `<!DOCTYPE html>
<html>
<head>
  <title>${faculty.name} - Teaching Schedule</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
    body { padding: 30px; background: #f8fafc; }
    .header { background: linear-gradient(135deg, #1e40af, #2563eb); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .info-box { background: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .info-item { padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #2563eb; }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
    .info-value { font-size: 18px; color: #1e40af; font-weight: 700; }
    .semester-section { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .semester-title { font-size: 20px; color: #1e40af; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: center; }
    th { background: #1e40af; color: white; font-size: 13px; font-weight: 600; text-transform: uppercase; }
    td { font-size: 12px; background: white; }
    .class-cell { background: #dbeafe !important; font-weight: 600; color: #1e40af; }
    .lunch-cell { background: #fef3c7 !important; color: #92400e; font-weight: 700; }
    .free-cell { background: #f1f5f9 !important; color: #94a3b8; }
    .time-slot { font-size: 10px; color: #6b7280; display: block; margin-bottom: 5px; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 13px; }
    @media print { body { background: white; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 Teaching Schedule Report</h1>
    <p>Faculty: ${faculty.name} | Division: ${faculty.division}</p>
  </div>

  <div class="info-box no-print">
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Faculty Name</div>
        <div class="info-value">${faculty.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Division</div>
        <div class="info-value">${faculty.division}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Subjects Teaching</div>
        <div class="info-value">${faculty.subjects.length}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Generated On</div>
        <div class="info-value">${new Date().toLocaleDateString('en-IN')}</div>
      </div>
    </div>
  </div>

  <div class="info-box">
    <h3 style="color: #1e40af; margin-bottom: 12px;">📚 Assigned Subjects</h3>
    <ul style="list-style: none; padding: 0;">`;

        faculty.subjects.forEach(subject => {
            html += `<li style="padding: 8px; background: #f0f9ff; margin-bottom: 8px; border-radius: 6px; border-left: 3px solid #2563eb;">
        <strong>${subject.name}</strong> (${subject.code}) - ${subject.semester}
      </li>`;
        });

        html += `</ul></div>`;

        Object.keys(facultySchedule).forEach(semester => {
            const routine = facultySchedule[semester];
            html += `
  <div class="semester-section">
    <div class="semester-title">${semester}</div>
    <table>
      <thead>
        <tr><th>Day / Time</th>`;

            for (let p = 1; p <= state.periodsPerDay; p++) {
                if (p === 4) {
                    html += `<th>LUNCH<br><span style="font-size:10px; font-weight:400">${timeSlots[p - 1]}</span></th>`;
                } else {
                    html += `<th>Period ${p}<br><span style="font-size:10px; font-weight:400">${timeSlots[p - 1]}</span></th>`;
                }
            }

            html += `</tr></thead><tbody>`;

            for (let d = 0; d < state.days; d++) {
                html += `<tr><th>${dayNames[d]}</th>`;
                for (let p = 0; p < state.periodsPerDay; p++) {
                    if (p === 3) {
                        html += `<td class="lunch-cell">🍽️ LUNCH</td>`;
                    } else if (routine[d] && routine[d][p]) {
                        const cls = routine[d][p];
                        html += `<td class="class-cell">
              <span class="time-slot">${timeSlots[p]}</span>
              <strong>${cls.subjectName}</strong><br>
              <small>${cls.subjectCode}</small>
            </td>`;
                    } else {
                        html += `<td class="free-cell">
              <span class="time-slot">${timeSlots[p]}</span>
              Free
            </td>`;
                    }
                }
                html += '</tr>';
            }

            html += `</tbody></table></div>`;
        });

        html += `
  <div class="footer">
    <p><strong>Lecture Map</strong> - Generated on ${new Date().toLocaleString('en-IN')} | TCEA Major Project</p>
  </div>
  <div style="margin-top: 20px; text-align: center;" class="no-print">
    <button onclick="window.print()" style="background: #2563eb; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600;">
      🖨️ Print Schedule
    </button>
  </div>
</body>
</html>`;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();
            showLoader(false);
            Swal.fire({
                icon: 'success',
                title: 'Schedule Generated!',
                text: `${faculty.name}'s schedule has been opened in a new window`,
                timer: 3000
            });
        } else {
            showLoader(false);
            Swal.fire('Error', 'Please allow pop-ups to view faculty schedule', 'error');
        }
    }, 500);
}

function exportToExcel() {
    if (Object.keys(state.routines).length === 0) {
        Swal.fire('Error', 'No routine to export', 'error');
        return;
    }

    let csv = '\uFEFF';
    Object.keys(state.routines).forEach(semester => {
        const routine = state.routines[semester];
        csv += `${semester}\n`;
        csv += 'Day/Period';
        for (let p = 1; p <= state.periodsPerDay; p++) csv += `,Period ${p} (${timeSlots[p - 1]})`;
        csv += '\n';
        for (let d = 0; d < state.days; d++) {
            csv += dayNames[d];
            for (let p = 0; p < state.periodsPerDay; p++) {
                const cls = routine[d][p];
                if (cls && cls.lunch) csv += ',LUNCH';
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