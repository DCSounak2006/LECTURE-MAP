export const courseSubjects = {
  diploma: {
    "Semester I": [
      { name: "Mathematics - I", code: "BSC101", credits: 4 },
      { name: "Physics", code: "BSC102", credits: 4 },
      { name: "Basic Electrical Engineering", code: "ESC101", credits: 4 },
      { name: "Engineering Graphics", code: "ESC102", credits: 4 },
      { name: "Communication Skills", code: "HSC101", credits: 2 },
      { name: "Physics Lab", code: "BSC102L", credits: 2 },
      { name: "Basic Electrical Lab", code: "ESC101L", credits: 2 },
      { name: "Engineering Graphics Lab", code: "ESC102L", credits: 2 }
    ],
    "Semester III": [
      { name: "Data Structures", code: "CST301", credits: 4 },
      { name: "Digital Electronics", code: "CST302", credits: 4 },
      { name: "Object Oriented Programming", code: "CST303", credits: 4 },
      { name: "Discrete Mathematics", code: "BSC301", credits: 4 },
      { name: "Data Structures Lab", code: "CST301L", credits: 2 },
      { name: "OOP Lab", code: "CST303L", credits: 2 }
    ],
    "Semester V": [
      { name: "Computer Networks", code: "CST501", credits: 4 },
      { name: "Operating Systems", code: "CST502", credits: 4 },
      { name: "Database Management Systems", code: "CST503", credits: 4 },
      { name: "Web Technology", code: "CST504", credits: 4 },
      { name: "Networks Lab", code: "CST501L", credits: 2 },
      { name: "DBMS Lab", code: "CST503L", credits: 2 },
      { name: "Web Tech Lab", code: "CST504L", credits: 2 }
    ]
  },
  btech: {
    "Semester I": [
      { name: "Engineering Mathematics - I", code: "BSC101", credits: 4 },
      { name: "Engineering Physics", code: "BSC102", credits: 3 },
      { name: "Engineering Chemistry", code: "BSC103", credits: 3 },
      { name: "Programming for Problem Solving", code: "ESC101", credits: 3 },
      { name: "Engineering Graphics & Design", code: "ESC102", credits: 3 },
      { name: "Physics Lab", code: "BSC102L", credits: 1 },
      { name: "Chemistry Lab", code: "BSC103L", credits: 1 },
      { name: "Programming Lab", code: "ESC101L", credits: 2 }
    ],
    "Semester III": [
      { name: "Data Structures & Algorithms", code: "CSE301", credits: 4 },
      { name: "Digital Logic Design", code: "CSE302", credits: 4 },
      { name: "Object Oriented Programming", code: "CSE303", credits: 4 },
      { name: "Discrete Mathematics", code: "BSC301", credits: 4 },
      { name: "Computer Organization", code: "CSE304", credits: 3 },
      { name: "DSA Lab", code: "CSE301L", credits: 2 },
      { name: "OOP Lab", code: "CSE303L", credits: 2 }
    ],
    "Semester V": [
      { name: "Computer Networks", code: "CSE501", credits: 4 },
      { name: "Operating Systems", code: "CSE502", credits: 4 },
      { name: "Database Systems", code: "CSE503", credits: 4 },
      { name: "Theory of Computation", code: "CSE504", credits: 4 },
      { name: "Software Engineering", code: "CSE505", credits: 3 },
      { name: "Networks Lab", code: "CSE501L", credits: 2 },
      { name: "OS Lab", code: "CSE502L", credits: 2 },
      { name: "DBMS Lab", code: "CSE503L", credits: 2 }
    ]
  }
};

export const facultyList = [
  "Prof. Arpita Banik",
  "Prof. Biswaraj Roy",
  "Prof. Purbani Kar",
  "Prof. Nabanita Shil",
  "Prof. Prasenjit Das",
  "Prof. Deeptanu Choudhury",
  "Prof. Rajna Saha",
  "Prof. Barnali Chowdhury",
  "Prof. Tina Debbarma",
  "Prof. Sourav Deb",
  "Prof. Ankita Bhattacharjee",
  "Prof. Priyanka Majumder",
  "Prof. Kankan Saha",
  "Prof. Sayan Saha",
  "Prof. Puspanjali Debnath"
];

export const timeSlots = [
  '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00',
  '01:00 - 02:00', '02:00 - 03:00', '03:00 - 04:00',
  '04:00 - 05:00', '05:00 - 06:00', '06:00 - 07:00'
];

export const rooms = [
  "R-123", "R-124", "R-138", "R-223", "R-228",
  "R-301", "R-302", "R-303", "R-304", "DE2 Room"
];

export const labs = [
  "CL-1", "CL-2A", "CL-3A", "CL-3B", "CL-4", "CL-5"
];

export const dayNames = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const semesterOrder = [
  'Semester I', 'Semester III', 'Semester V'
];
