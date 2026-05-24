import { 
  ApplicationUser, Group, Subject, Student, Teacher, Grade, ScheduleItem, TeacherSubjectGroup 
} from './schema';

// Storage Keys
const KEY_PREFIX = 'edu_mobile_';
const KEYS = {
  USERS: KEY_PREFIX + 'users',
  GROUPS: KEY_PREFIX + 'groups',
  SUBJECTS: KEY_PREFIX + 'subjects',
  STUDENTS: KEY_PREFIX + 'students',
  TEACHERS: KEY_PREFIX + 'teachers',
  GRADES: KEY_PREFIX + 'grades',
  SCHEDULE: KEY_PREFIX + 'schedule',
  BINDINGS: KEY_PREFIX + 'bindings',
  CURRENT_USER: KEY_PREFIX + 'current_user'
};

// Simple event system for reactivity
type DbListener = () => void;
const listeners = new Set<DbListener>();

export const subscribeToDb = (listener: DbListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyDbChanged = () => {
  listeners.forEach(l => {
    try {
      l();
    } catch (e) {
      console.error('Db listener error:', e);
    }
  });
};

// Local storage helpers
const readData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return fallback;
  }
};

const writeData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Database Initialization (Seeding)
export const initDb = (force = false) => {
  if (!force && localStorage.getItem(KEYS.USERS)) {
    return; // Already initialized
  }

  // 1. Create Users
  const users: ApplicationUser[] = [
    { id: 'u_admin', email: 'admin@example.com', fullName: 'System Administrator', role: 'Admin' },
    { id: 'u_teacher', email: 'teacher@example.com', fullName: 'Иван Иванов', role: 'Teacher' },
    { id: 'u_student', email: 'student@example.com', fullName: 'Петр Петров', role: 'Student' }
  ];

  // Additional teachers
  for (let i = 1; i <= 4; i++) {
    users.push({
      id: `u_teacher_${i}`,
      email: `teacher${i}@example.com`,
      fullName: `Преподаватель ${i}`,
      role: 'Teacher'
    });
  }

  // Additional students
  for (let i = 1; i <= 15; i++) {
    users.push({
      id: `u_student_${i}`,
      email: `student${i}@example.com`,
      fullName: `Студент ${i}`,
      role: 'Student'
    });
  }

  // 2. Groups
  const groups: Group[] = [
    { id: 1, name: 'ИС-21', course: 2 },
    { id: 2, name: 'ПИ-31', course: 3 },
    { id: 3, name: 'ИВТ-22', course: 2 }
  ];

  // 3. Subjects
  const subjects: Subject[] = [
    { id: 1, name: 'Математика' },
    { id: 2, name: 'Программирование' },
    { id: 3, name: 'Базы данных' },
    { id: 4, name: 'Английский язык' },
    { id: 5, name: 'Сети' },
    { id: 6, name: 'Алгоритмы' }
  ];

  // 4. Teachers profile
  const teachers: Teacher[] = [
    { id: 1, fullName: 'Иван Иванов', applicationUserId: 'u_teacher' },
    { id: 2, fullName: 'Преподаватель 1', applicationUserId: 'u_teacher_1' },
    { id: 3, fullName: 'Преподаватель 2', applicationUserId: 'u_teacher_2' },
    { id: 4, fullName: 'Преподаватель 3', applicationUserId: 'u_teacher_3' },
    { id: 5, fullName: 'Преподаватель 4', applicationUserId: 'u_teacher_4' }
  ];

  // 5. Students profile
  const students: Student[] = [
    { id: 1, fullName: 'Петр Петров', groupId: 1, applicationUserId: 'u_student' }
  ];

  for (let i = 1; i <= 15; i++) {
    students.push({
      id: i + 1,
      fullName: `Студент ${i}`,
      groupId: groups[(i) % 3].id,
      applicationUserId: `u_student_${i}`
    });
  }

  // 6. Teacher-Subject-Group bindings (replicating deterministic SeedData.cs seed)
  // SeedData.cs uses Random(42)
  // We can seed logical bindings ourselves
  const bindings: TeacherSubjectGroup[] = [];
  let bindingId = 1;
  
  // Distribute subjects among teachers logically
  // Ivan Ivanov (Teacher ID 1): Prog, Databases
  // Prep 1 (Teacher ID 2): Math, Algorithms
  // Prep 2 (Teacher ID 3): English, Networks
  // Prep 3 (Teacher ID 4): Prog, Math
  // Prep 4 (Teacher ID 5): Databases, Networks
  const teacherSubjectDistribution: { [key: number]: number[] } = {
    1: [2, 3], // Ivan: Prog, Db
    2: [1, 6], // T1: Math, Algo
    3: [4, 5], // T2: Eng, Net
    4: [2, 1], // T3: Prog, Math
    5: [3, 5]  // T4: Db, Net
  };

  groups.forEach(g => {
    subjects.forEach(sub => {
      // Find a teacher that teaches this subject
      const eligibleTeachers = teachers.filter(t => 
        teacherSubjectDistribution[t.id]?.includes(sub.id)
      );
      const selectedTeacher = eligibleTeachers.length > 0 
        ? eligibleTeachers[g.id % eligibleTeachers.length] 
        : teachers[0];

      bindings.push({
        id: bindingId++,
        teacherId: selectedTeacher.id,
        subjectId: sub.id,
        groupId: g.id
      });
    });
  });

  // 7. Schedule Items (Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5)
  const schedule: ScheduleItem[] = [];
  let scheduleId = 1;
  const timeSlots = [
    { start: '08:00', end: '09:30' },
    { start: '09:40', end: '11:10' },
    { start: '11:30', end: '13:00' },
    { start: '13:20', end: '14:50' }
  ];

  bindings.forEach((tsg, index) => {
    // 2-3 lessons per group per day
    const day = (index % 5) + 1; // Mon - Fri
    const slot = timeSlots[index % timeSlots.length];
    
    schedule.push({
      id: scheduleId++,
      groupId: tsg.groupId,
      subjectId: tsg.subjectId,
      teacherId: tsg.teacherId,
      dayOfWeek: day,
      startTime: slot.start,
      endTime: slot.end,
      classroom: `Ауд. ${100 + (index * 23) % 400}`
    });
  });

  // 8. Grades Seeding (Past 60 days)
  const grades: Grade[] = [];
  let gradeId = 1;
  
  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(now.getDate() - 30);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setDate(now.getDate() - 60);

  // Deterministic random generator for grades
  let seed = 42;
  const pseudoRnd = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  students.forEach(student => {
    subjects.forEach(subject => {
      // Find teacher from binding
      const binding = bindings.find(b => b.groupId === student.groupId && b.subjectId === subject.id);
      const teacherId = binding ? binding.teacherId : 1;

      // Base grade for student/subject to simulate trends
      let baseTwoMonthsAgo = Math.floor(65 + pseudoRnd() * 20); // 65-85
      let baseLastMonth = baseTwoMonthsAgo;
      let baseThisMonth = baseTwoMonthsAgo;

      // Replicate specific trends from C#
      if (subject.name === 'Математика') {
        baseLastMonth -= 6;
        baseThisMonth -= 16; // Decline
      } else if (subject.name === 'Программирование') {
        baseLastMonth += 8;
        baseThisMonth += 18; // Growth
      }

      // Ensure boundaries
      const clamp = (val: number) => Math.min(100, Math.max(0, val));

      // Generate 2 grades in month 1 (45-60 days ago)
      const dayOffset1 = Math.floor(pseudoRnd() * 12);
      const dayOffset2 = 15 + Math.floor(pseudoRnd() * 12);
      
      const d1 = new Date(twoMonthsAgo);
      d1.setDate(d1.getDate() + dayOffset1);
      grades.push({
        id: gradeId++,
        studentId: student.id,
        subjectId: subject.id,
        teacherId,
        value: clamp(baseTwoMonthsAgo + Math.floor(-5 + pseudoRnd() * 10)),
        date: d1.toISOString(),
        comment: pseudoRnd() > 0.75 ? 'Активная работа на семинаре' : undefined
      });

      const d2 = new Date(twoMonthsAgo);
      d2.setDate(d2.getDate() + dayOffset2);
      grades.push({
        id: gradeId++,
        studentId: student.id,
        subjectId: subject.id,
        teacherId,
        value: clamp(baseTwoMonthsAgo + Math.floor(-5 + pseudoRnd() * 10)),
        date: d2.toISOString(),
        comment: pseudoRnd() > 0.8 ? 'Выполнение лабораторной №1' : undefined
      });

      // Generate 2 grades in month 2 (15-30 days ago)
      const d3 = new Date(lastMonth);
      d3.setDate(d3.getDate() + dayOffset1);
      grades.push({
        id: gradeId++,
        studentId: student.id,
        subjectId: subject.id,
        teacherId,
        value: clamp(baseLastMonth + Math.floor(-5 + pseudoRnd() * 10)),
        date: d3.toISOString()
      });

      const d4 = new Date(lastMonth);
      d4.setDate(d4.getDate() + dayOffset2);
      grades.push({
        id: gradeId++,
        studentId: student.id,
        subjectId: subject.id,
        teacherId,
        value: clamp(baseLastMonth + Math.floor(-5 + pseudoRnd() * 10)),
        date: d4.toISOString(),
        comment: pseudoRnd() > 0.8 ? 'Контрольная работа' : undefined
      });

      // Generate 1 recent grade (1-10 days ago)
      const d5 = new Date(now);
      d5.setDate(d5.getDate() - (1 + Math.floor(pseudoRnd() * 10)));
      grades.push({
        id: gradeId++,
        studentId: student.id,
        subjectId: subject.id,
        teacherId,
        value: clamp(baseThisMonth + Math.floor(-5 + pseudoRnd() * 10)),
        date: d5.toISOString(),
        comment: 'Текущая успеваемость'
      });
    });
  });

  // Write all to storage
  writeData(KEYS.USERS, users);
  writeData(KEYS.GROUPS, groups);
  writeData(KEYS.SUBJECTS, subjects);
  writeData(KEYS.TEACHERS, teachers);
  writeData(KEYS.STUDENTS, students);
  writeData(KEYS.BINDINGS, bindings);
  writeData(KEYS.SCHEDULE, schedule);
  writeData(KEYS.GRADES, grades);
  writeData(KEYS.CURRENT_USER, null);

  notifyDbChanged();
};

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------
export const getCurrentUser = (): ApplicationUser | null => {
  return readData<ApplicationUser | null>(KEYS.CURRENT_USER, null);
};

export const login = (email: string, pass: string): ApplicationUser | null => {
  const users = readData<ApplicationUser[]>(KEYS.USERS, []);
  const normalizedEmail = email.trim().toLowerCase();
  
  // Realistic check
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) return null;

  // Simple password check (mirror C# presets)
  let isValidPassword = false;
  if (user.role === 'Admin' && pass === 'Admin123!') isValidPassword = true;
  if (user.role === 'Teacher' && pass === 'Teacher123!') isValidPassword = true;
  if (user.role === 'Student' && pass === 'Student123!') isValidPassword = true;

  if (!isValidPassword) return null;

  writeData(KEYS.CURRENT_USER, user);
  notifyDbChanged();
  return user;
};

export const logout = (): void => {
  writeData(KEYS.CURRENT_USER, null);
  notifyDbChanged();
};

// ----------------------------------------------------
// Student Analytics & Dashboard API
// ----------------------------------------------------
export interface SubjectProgressDto {
  subjectId: number;
  subjectName: string;
  currentMonthAverage: number;
  previousMonthAverage: number;
  difference: number;
}

export interface StudentDashboardDto {
  averageScore: number;
  totalStudentsInGroup: number;
  positionInGroup: number;
  subjectCount: number;
  bestSubject: string;
  weakestSubject: string;
  progress: SubjectProgressDto[];
}

export const getStudentProfileByUserId = (userId: string): Student | null => {
  const students = readData<Student[]>(KEYS.STUDENTS, []);
  return students.find(s => s.applicationUserId === userId) || null;
};

export const getStudentDashboardData = (studentId: number): StudentDashboardDto => {
  const students = readData<Student[]>(KEYS.STUDENTS, []);
  const student = students.find(s => s.id === studentId);
  if (!student) {
    return {
      averageScore: 0, totalStudentsInGroup: 0, positionInGroup: 0,
      subjectCount: 0, bestSubject: 'Нет', weakestSubject: 'Нет', progress: []
    };
  }

  const grades = readData<Grade[]>(KEYS.GRADES, []).filter(g => g.studentId === studentId);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []).filter(b => b.groupId === student.groupId);

  const averageScore = grades.length > 0 
    ? grades.reduce((acc, curr) => acc + curr.value, 0) / grades.length 
    : 0;

  // Group grades by subject
  const subjectGradesMap: { [key: number]: number[] } = {};
  grades.forEach(g => {
    if (!subjectGradesMap[g.subjectId]) subjectGradesMap[g.subjectId] = [];
    subjectGradesMap[g.subjectId].push(g.value);
  });

  // Calculate best/weakest subject
  let bestSubjectName = 'Нет';
  let bestAvg = -1;
  let weakestSubjectName = 'Нет';
  let weakestAvg = 101;

  Object.keys(subjectGradesMap).forEach(subIdStr => {
    const subId = parseInt(subIdStr);
    const sub = subjects.find(s => s.id === subId);
    if (!sub) return;

    const values = subjectGradesMap[subId];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    if (avg > bestAvg) {
      bestAvg = avg;
      bestSubjectName = sub.name;
    }
    if (avg < weakestAvg) {
      weakestAvg = avg;
      weakestSubjectName = sub.name;
    }
  });

  // Progress calculations (comparing last 30 days and previous 30 days)
  const now = new Date();
  const lastMonthStart = new Date();
  lastMonthStart.setDate(now.getDate() - 30);
  const previousMonthStart = new Date();
  previousMonthStart.setDate(now.getDate() - 60);

  const progressList: SubjectProgressDto[] = [];
  
  bindings.forEach(bind => {
    const sub = subjects.find(s => s.id === bind.subjectId);
    if (!sub) return;

    const subGrades = grades.filter(g => g.subjectId === sub.id);
    const currentMonthGrades = subGrades.filter(g => {
      const gDate = new Date(g.date);
      return gDate >= lastMonthStart && gDate <= now;
    });
    const prevMonthGrades = subGrades.filter(g => {
      const gDate = new Date(g.date);
      return gDate >= previousMonthStart && gDate < lastMonthStart;
    });

    if (currentMonthGrades.length > 0 || prevMonthGrades.length > 0) {
      const curAvg = currentMonthGrades.length > 0 
        ? currentMonthGrades.reduce((a, b) => a + b.value, 0) / currentMonthGrades.length 
        : 0;
      const prevAvg = prevMonthGrades.length > 0 
        ? prevMonthGrades.reduce((a, b) => a + b.value, 0) / prevMonthGrades.length 
        : 0;

      progressList.push({
        subjectId: sub.id,
        subjectName: sub.name,
        currentMonthAverage: Math.round(curAvg * 10) / 10,
        previousMonthAverage: Math.round(prevAvg * 10) / 10,
        difference: Math.round((curAvg - prevAvg) * 10) / 10
      });
    }
  });

  // Position in group ranking
  const groupStudents = students.filter(s => s.groupId === student.groupId);
  const allGrades = readData<Grade[]>(KEYS.GRADES, []);
  
  const groupAverages = groupStudents.map(s => {
    const sGrades = allGrades.filter(g => g.studentId === s.id);
    const avg = sGrades.length > 0 ? sGrades.reduce((acc, curr) => acc + curr.value, 0) / sGrades.length : 0;
    return { studentId: s.id, avg };
  }).sort((a, b) => b.avg - a.avg);

  let position = groupAverages.findIndex(x => x.studentId === studentId) + 1;
  if (position === 0) position = groupStudents.length;

  return {
    averageScore: Math.round(averageScore * 100) / 100,
    totalStudentsInGroup: groupStudents.length,
    positionInGroup: position,
    subjectCount: bindings.length,
    bestSubject: bestSubjectName,
    weakestSubject: weakestSubjectName,
    progress: progressList
  };
};

export const getStudentSubjectAveragesTimeline = (studentId: number): { [key: string]: number } => {
  const grades = readData<Grade[]>(KEYS.GRADES, []).filter(g => g.studentId === studentId);
  
  // Sort grades by date
  const sorted = [...grades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Group by Month Year
  const timeline: { [key: string]: { sum: number, count: number } } = {};
  
  sorted.forEach(g => {
    const d = new Date(g.date);
    const label = d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
    if (!timeline[label]) timeline[label] = { sum: 0, count: 0 };
    timeline[label].sum += g.value;
    timeline[label].count += 1;
  });

  const result: { [key: string]: number } = {};
  Object.keys(timeline).forEach(label => {
    result[label] = Math.round((timeline[label].sum / timeline[label].count) * 10) / 10;
  });

  return result;
};

// ----------------------------------------------------
// Rankings API
// ----------------------------------------------------
export interface StudentRankingDto {
  position: number;
  studentId: number;
  fullName: string;
  averageScore: number;
  gradeCount: number;
}

export interface GroupRankingDto {
  position: number;
  groupId: number;
  groupName: string;
  course: number;
  studentCount: number;
  averageScore: number;
}export const getStudentGroupRanking = (groupId: number, subjectId?: number): StudentRankingDto[] => {
  const students = readData<Student[]>(KEYS.STUDENTS, []).filter(s => s.groupId === groupId);
  const grades = readData<Grade[]>(KEYS.GRADES, []);

  const ranking = students.map(s => {
    const sGrades = grades.filter(g => g.studentId === s.id && (subjectId === undefined || g.subjectId === subjectId));
    const avg = sGrades.length > 0 
      ? sGrades.reduce((a, b) => a + b.value, 0) / sGrades.length 
      : 0;
    return {
      position: 0,
      studentId: s.id,
      fullName: s.fullName,
      averageScore: Math.round(avg * 100) / 100,
      gradeCount: sGrades.length
    };
  }).sort((a, b) => b.averageScore - a.averageScore);

  ranking.forEach((item, index) => {
    item.position = index + 1;
  });

  return ranking;
};

export const getGroupRanking = (subjectId?: number): GroupRankingDto[] => {
  const groups = readData<Group[]>(KEYS.GROUPS, []);
  const students = readData<Student[]>(KEYS.STUDENTS, []);
  const grades = readData<Grade[]>(KEYS.GRADES, []);

  const ranking = groups.map(g => {
    const gStudents = students.filter(s => s.groupId === g.id);
    const gStudentIds = gStudents.map(s => s.id);
    const gGrades = grades.filter(g => gStudentIds.includes(g.studentId) && (subjectId === undefined || g.subjectId === subjectId));
    
    const avg = gGrades.length > 0 
      ? gGrades.reduce((a, b) => a + b.value, 0) / gGrades.length 
      : 0;

    return {
      position: 0,
      groupId: g.id,
      groupName: g.name,
      course: g.course,
      studentCount: gStudents.length,
      averageScore: Math.round(avg * 100) / 100
    };
  }).sort((a, b) => b.averageScore - a.averageScore);

  ranking.forEach((item, index) => {
    item.position = index + 1;
  });

  return ranking;
};
// ----------------------------------------------------
// Schedule API
// ----------------------------------------------------
export interface ExtendedScheduleItem extends ScheduleItem {
  subjectName: string;
  teacherName: string;
  groupName: string;
}

export const getWeeklySchedule = (groupId: number): ExtendedScheduleItem[] => {
  const items = readData<ScheduleItem[]>(KEYS.SCHEDULE, []).filter(s => s.groupId === groupId);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);
  const groups = readData<Group[]>(KEYS.GROUPS, []);

  return items.map(item => ({
    ...item,
    subjectName: subjects.find(s => s.id === item.subjectId)?.name || 'Неизвестно',
    teacherName: teachers.find(t => t.id === item.teacherId)?.fullName || 'Неизвестно',
    groupName: groups.find(g => g.id === item.groupId)?.name || 'Неизвестно'
  })).sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });
};

export const getTodaySchedule = (groupId: number): ExtendedScheduleItem[] => {
  const todayDayOfWeek = new Date().getDay(); // 0 = Sun, 1 = Mon ...
  const weekly = getWeeklySchedule(groupId);
  
  // Filter for today
  return weekly.filter(s => s.dayOfWeek === todayDayOfWeek);
};

// ----------------------------------------------------
// Teacher Portal API
// ----------------------------------------------------
export interface TeacherGroupStatDto {
  groupId: number;
  groupName: string;
  studentCount: number;
  averageScore: number;
}

export interface WeakStudentDto {
  studentId: number;
  studentName: string;
  groupName: string;
  averageScore: number;
}

export interface ExtendedGrade extends Grade {
  studentName: string;
  subjectName: string;
  teacherName: string;
}

export const getTeacherProfileByUserId = (userId: string): Teacher | null => {
  const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);
  return teachers.find(t => t.applicationUserId === userId) || null;
};

export const getTeacherDashboardData = (teacherId: number) => {
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []).filter(b => b.teacherId === teacherId);
  const groups = readData<Group[]>(KEYS.GROUPS, []);
  const students = readData<Student[]>(KEYS.STUDENTS, []);
  const grades = readData<Grade[]>(KEYS.GRADES, []);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  
  // 1. Group Stats
  const teacherGroupIds = Array.from(new Set(bindings.map(b => b.groupId)));
  const groupStats: TeacherGroupStatDto[] = teacherGroupIds.map(gId => {
    const grp = groups.find(g => g.id === gId);
    const grpStudents = students.filter(s => s.groupId === gId);
    const grpStudentIds = grpStudents.map(s => s.id);
    const grpGrades = grades.filter(g => g.teacherId === teacherId && grpStudentIds.includes(g.studentId));

    const avg = grpGrades.length > 0 
      ? grpGrades.reduce((a, b) => a + b.value, 0) / grpGrades.length 
      : 0;

    return {
      groupId: gId,
      groupName: grp?.name || 'Неизвестно',
      studentCount: grpStudents.length,
      averageScore: Math.round(avg * 10) / 10
    };
  });

  // 2. Weak students taught by this teacher (average score across all teacher's subjects < 60)
  const teacherGrades = grades.filter(g => g.teacherId === teacherId);
  const studentAverages: { [key: number]: { sum: number, count: number, name: string, grpName: string } } = {};
  
  teacherGrades.forEach(g => {
    const std = students.find(s => s.id === g.studentId);
    if (!std) return;
    
    if (!studentAverages[g.studentId]) {
      const grp = groups.find(g => g.id === std.groupId);
      studentAverages[g.studentId] = {
        sum: 0, count: 0,
        name: std.fullName,
        grpName: grp?.name || 'Неизвестно'
      };
    }
    
    studentAverages[g.studentId].sum += g.value;
    studentAverages[g.studentId].count += 1;
  });

  const weakStudents: WeakStudentDto[] = [];
  Object.keys(studentAverages).forEach(sIdStr => {
    const sId = parseInt(sIdStr);
    const val = studentAverages[sId];
    const avg = val.sum / val.count;
    if (avg < 60) {
      weakStudents.push({
        studentId: sId,
        studentName: val.name,
        groupName: val.grpName,
        averageScore: Math.round(avg * 10) / 10
      });
    }
  });

  weakStudents.sort((a, b) => a.averageScore - b.averageScore);

  // 3. Recent grades given by this teacher
  const recentGrades: ExtendedGrade[] = [...teacherGrades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map(g => ({
      ...g,
      studentName: students.find(s => s.id === g.studentId)?.fullName || 'Неизвестно',
      subjectName: subjects.find(s => s.id === g.subjectId)?.name || 'Неизвестно',
      teacherName: 'Иван Иванов'
    }));

  // 4. Teacher's Schedule
  const scheduleItems = readData<ScheduleItem[]>(KEYS.SCHEDULE, []).filter(s => s.teacherId === teacherId);
  const teacherSchedule = scheduleItems.map(item => ({
    ...item,
    subjectName: subjects.find(s => s.id === item.subjectId)?.name || 'Неизвестно',
    teacherName: 'Иван Иванов',
    groupName: groups.find(g => g.id === item.groupId)?.name || 'Неизвестно'
  })).sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  return {
    groupStats,
    weakStudents,
    recentGrades,
    teacherSchedule
  };
};

export const getTeacherGroups = (teacherId: number): Group[] => {
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []).filter(b => b.teacherId === teacherId);
  const groups = readData<Group[]>(KEYS.GROUPS, []);
  const boundGroupIds = Array.from(new Set(bindings.map(b => b.groupId)));
  return groups.filter(g => boundGroupIds.includes(g.id));
};

export const getTeacherSubjectsForGroup = (teacherId: number, groupId: number): Subject[] => {
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []).filter(b => b.teacherId === teacherId && b.groupId === groupId);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const boundSubIds = Array.from(new Set(bindings.map(b => b.subjectId)));
  return subjects.filter(s => boundSubIds.includes(s.id));
};

export const getStudentsInGroup = (groupId: number): Student[] => {
  return readData<Student[]>(KEYS.STUDENTS, []).filter(s => s.groupId === groupId).sort((a, b) => a.fullName.localeCompare(b.fullName));
};

// ----------------------------------------------------
// Core Database Mutations (Grade, User, Group, Subject, Bindings, Schedule)
// ----------------------------------------------------
export const getGradesForStudentAndSubject = (studentId: number, subjectId: number): ExtendedGrade[] => {
  const grades = readData<Grade[]>(KEYS.GRADES, []).filter(g => g.studentId === studentId && g.subjectId === subjectId);
  const students = readData<Student[]>(KEYS.STUDENTS, []);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);

  return grades.map(g => ({
    ...g,
    studentName: students.find(s => s.id === g.studentId)?.fullName || 'Неизвестно',
    subjectName: subjects.find(s => s.id === g.subjectId)?.name || 'Неизвестно',
    teacherName: teachers.find(t => t.id === g.teacherId)?.fullName || 'Неизвестно'
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getGradesByStudent = (studentId: number): ExtendedGrade[] => {
  const grades = readData<Grade[]>(KEYS.GRADES, []).filter(g => g.studentId === studentId);
  const students = readData<Student[]>(KEYS.STUDENTS, []);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);

  return grades.map(g => ({
    ...g,
    studentName: students.find(s => s.id === g.studentId)?.fullName || 'Неизвестно',
    subjectName: subjects.find(s => s.id === g.subjectId)?.name || 'Неизвестно',
    teacherName: teachers.find(t => t.id === g.teacherId)?.fullName || 'Неизвестно'
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createGrade = (grade: Omit<Grade, 'id' | 'date'>): Grade => {
  const grades = readData<Grade[]>(KEYS.GRADES, []);
  const newGrade: Grade = {
    ...grade,
    id: grades.length > 0 ? Math.max(...grades.map(g => g.id)) + 1 : 1,
    date: new Date().toISOString()
  };
  
  grades.push(newGrade);
  writeData(KEYS.GRADES, grades);
  notifyDbChanged();
  return newGrade;
};

export const deleteGrade = (id: number): void => {
  let grades = readData<Grade[]>(KEYS.GRADES, []);
  grades = grades.filter(g => g.id !== id);
  writeData(KEYS.GRADES, grades);
  notifyDbChanged();
};

// ----------------------------------------------------
// Admin CRUD APIs
// ----------------------------------------------------
export interface ExtendedUserManagementDto extends ApplicationUser {
  groupId?: number;
  groupName?: string;
}

export const getAllUsers = (): ExtendedUserManagementDto[] => {
  const users = readData<ApplicationUser[]>(KEYS.USERS, []);
  const students = readData<Student[]>(KEYS.STUDENTS, []);
  const groups = readData<Group[]>(KEYS.GROUPS, []);
  
  return users.map(u => {
    const dto: ExtendedUserManagementDto = { ...u };
    if (u.role === 'Student') {
      const student = students.find(s => s.applicationUserId === u.id);
      if (student) {
        dto.groupId = student.groupId;
        dto.groupName = groups.find(g => g.id === student.groupId)?.name;
      }
    }
    return dto;
  });
};

export const createUser = (email: string, pass: string, fullName: string, role: 'Student' | 'Teacher', groupId?: number): ApplicationUser | string => {
  const users = readData<ApplicationUser[]>(KEYS.USERS, []);
  if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return 'Пользователь с таким Email уже существует!';
  }

  const uId = 'u_' + Math.random().toString(36).substr(2, 9);
  const newUser: ApplicationUser = {
    id: uId,
    email: email.trim(),
    fullName,
    role
  };

  users.push(newUser);
  writeData(KEYS.USERS, users);

  if (role === 'Student') {
    const students = readData<Student[]>(KEYS.STUDENTS, []);
    const newStudentId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    students.push({
      id: newStudentId,
      fullName,
      groupId: groupId || 1,
      applicationUserId: uId
    });
    writeData(KEYS.STUDENTS, students);
  } else if (role === 'Teacher') {
    const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);
    const newTeacherId = teachers.length > 0 ? Math.max(...teachers.map(t => t.id)) + 1 : 1;
    teachers.push({
      id: newTeacherId,
      fullName,
      applicationUserId: uId
    });
    writeData(KEYS.TEACHERS, teachers);
  }

  notifyDbChanged();
  return newUser;
};

export const updateUser = (id: string, fullName: string, groupId?: number): void => {
  const users = readData<ApplicationUser[]>(KEYS.USERS, []);
  const uIndex = users.findIndex(u => u.id === id);
  if (uIndex !== -1) {
    users[uIndex].fullName = fullName;
    writeData(KEYS.USERS, users);

    if (users[uIndex].role === 'Student') {
      const students = readData<Student[]>(KEYS.STUDENTS, []);
      const sIndex = students.findIndex(s => s.applicationUserId === id);
      if (sIndex !== -1) {
        students[sIndex].fullName = fullName;
        if (groupId) students[sIndex].groupId = groupId;
        writeData(KEYS.STUDENTS, students);
      }
    } else if (users[uIndex].role === 'Teacher') {
      const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);
      const tIndex = teachers.findIndex(t => t.applicationUserId === id);
      if (tIndex !== -1) {
        teachers[tIndex].fullName = fullName;
        writeData(KEYS.TEACHERS, teachers);
      }
    }

    notifyDbChanged();
  }
};

export const deleteUser = (id: string): void => {
  let users = readData<ApplicationUser[]>(KEYS.USERS, []);
  const user = users.find(u => u.id === id);
  if (!user) return;

  users = users.filter(u => u.id !== id);
  writeData(KEYS.USERS, users);

  if (user.role === 'Student') {
    let students = readData<Student[]>(KEYS.STUDENTS, []);
    const student = students.find(s => s.applicationUserId === id);
    if (student) {
      students = students.filter(s => s.id !== student.id);
      writeData(KEYS.STUDENTS, students);
      // Clean up grades
      let grades = readData<Grade[]>(KEYS.GRADES, []);
      grades = grades.filter(g => g.studentId !== student.id);
      writeData(KEYS.GRADES, grades);
    }
  } else if (user.role === 'Teacher') {
    let teachers = readData<Teacher[]>(KEYS.TEACHERS, []);
    const teacher = teachers.find(t => t.applicationUserId === id);
    if (teacher) {
      teachers = teachers.filter(t => t.id !== teacher.id);
      writeData(KEYS.TEACHERS, teachers);
      
      // Clean up bindings
      let bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
      bindings = bindings.filter(b => b.teacherId !== teacher.id);
      writeData(KEYS.BINDINGS, bindings);
      
      // Clean up schedule
      let schedule = readData<ScheduleItem[]>(KEYS.SCHEDULE, []);
      schedule = schedule.filter(s => s.teacherId !== teacher.id);
      writeData(KEYS.SCHEDULE, schedule);
    }
  }

  notifyDbChanged();
};

// Groups CRUD
export const getAllGroups = (): Group[] => readData<Group[]>(KEYS.GROUPS, []);
export const createGroup = (name: string, course: number): Group => {
  const groups = readData<Group[]>(KEYS.GROUPS, []);
  const newGroup = {
    id: groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1,
    name,
    course
  };
  groups.push(newGroup);
  writeData(KEYS.GROUPS, groups);
  notifyDbChanged();
  return newGroup;
};
export const updateGroup = (id: number, name: string, course: number): void => {
  const groups = readData<Group[]>(KEYS.GROUPS, []);
  const idx = groups.findIndex(g => g.id === id);
  if (idx !== -1) {
    groups[idx].name = name;
    groups[idx].course = course;
    writeData(KEYS.GROUPS, groups);
    notifyDbChanged();
  }
};
export const deleteGroup = (id: number): void => {
  let groups = readData<Group[]>(KEYS.GROUPS, []);
  groups = groups.filter(g => g.id !== id);
  writeData(KEYS.GROUPS, groups);
  
  // Clean up students
  let students = readData<Student[]>(KEYS.STUDENTS, []);
  students = students.filter(s => s.groupId !== id);
  writeData(KEYS.STUDENTS, students);

  // Clean up bindings & schedules
  let bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
  bindings = bindings.filter(b => b.groupId !== id);
  writeData(KEYS.BINDINGS, bindings);

  let schedule = readData<ScheduleItem[]>(KEYS.SCHEDULE, []);
  schedule = schedule.filter(s => s.groupId !== id);
  writeData(KEYS.SCHEDULE, schedule);

  notifyDbChanged();
};

// Subjects CRUD
export const getAllSubjects = (): Subject[] => readData<Subject[]>(KEYS.SUBJECTS, []);
export const createSubject = (name: string): Subject => {
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const newSub = {
    id: subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 1,
    name
  };
  subjects.push(newSub);
  writeData(KEYS.SUBJECTS, subjects);
  notifyDbChanged();
  return newSub;
};
export const updateSubject = (id: number, name: string): void => {
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const idx = subjects.findIndex(s => s.id === id);
  if (idx !== -1) {
    subjects[idx].name = name;
    writeData(KEYS.SUBJECTS, subjects);
    notifyDbChanged();
  }
};
export const deleteSubject = (id: number): void => {
  let subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  subjects = subjects.filter(s => s.id !== id);
  writeData(KEYS.SUBJECTS, subjects);

  // Clean up bindings & schedules & grades
  let bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
  bindings = bindings.filter(b => b.subjectId !== id);
  writeData(KEYS.BINDINGS, bindings);

  let schedule = readData<ScheduleItem[]>(KEYS.SCHEDULE, []);
  schedule = schedule.filter(s => s.subjectId !== id);
  writeData(KEYS.SCHEDULE, schedule);

  let grades = readData<Grade[]>(KEYS.GRADES, []);
  grades = grades.filter(g => g.subjectId !== id);
  writeData(KEYS.GRADES, grades);

  notifyDbChanged();
};

// Teachers and Bindings CRUD
export const getAllTeachers = (): Teacher[] => readData<Teacher[]>(KEYS.TEACHERS, []);
export const getAllBindings = (): (TeacherSubjectGroup & { teacherName: string, subjectName: string, groupName: string })[] => {
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
  const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const groups = readData<Group[]>(KEYS.GROUPS, []);

  return bindings.map(b => ({
    ...b,
    teacherName: teachers.find(t => t.id === b.teacherId)?.fullName || 'Неизвестно',
    subjectName: subjects.find(s => s.id === b.subjectId)?.name || 'Неизвестно',
    groupName: groups.find(g => g.id === b.groupId)?.name || 'Неизвестно'
  }));
};
export const createBinding = (teacherId: number, subjectId: number, groupId: number): TeacherSubjectGroup | string => {
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
  if (bindings.some(b => b.teacherId === teacherId && b.subjectId === subjectId && b.groupId === groupId)) {
    return 'Такая привязка уже существует!';
  }
  const newBind = {
    id: bindings.length > 0 ? Math.max(...bindings.map(b => b.id)) + 1 : 1,
    teacherId,
    subjectId,
    groupId
  };
  bindings.push(newBind);
  writeData(KEYS.BINDINGS, bindings);
  notifyDbChanged();
  return newBind;
};
export const updateBinding = (id: number, teacherId: number, subjectId: number, groupId: number): void => {
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
  const idx = bindings.findIndex(b => b.id === id);
  if (idx !== -1) {
    bindings[idx].teacherId = teacherId;
    bindings[idx].subjectId = subjectId;
    bindings[idx].groupId = groupId;
    writeData(KEYS.BINDINGS, bindings);
    notifyDbChanged();
  }
};
export const deleteBinding = (id: number): void => {
  let bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
  bindings = bindings.filter(b => b.id !== id);
  writeData(KEYS.BINDINGS, bindings);
  notifyDbChanged();
};

// Schedule CRUD
export const getAllScheduleItems = (): ExtendedScheduleItem[] => {
  const items = readData<ScheduleItem[]>(KEYS.SCHEDULE, []);
  const subjects = readData<Subject[]>(KEYS.SUBJECTS, []);
  const teachers = readData<Teacher[]>(KEYS.TEACHERS, []);
  const groups = readData<Group[]>(KEYS.GROUPS, []);

  return items.map(item => ({
    ...item,
    subjectName: subjects.find(s => s.id === item.subjectId)?.name || 'Неизвестно',
    teacherName: teachers.find(t => t.id === item.teacherId)?.fullName || 'Неизвестно',
    groupName: groups.find(g => g.id === item.groupId)?.name || 'Неизвестно'
  }));
};
export const createScheduleItem = (item: Omit<ScheduleItem, 'id'>): ScheduleItem => {
  const items = readData<ScheduleItem[]>(KEYS.SCHEDULE, []);
  const newItem = {
    ...item,
    id: items.length > 0 ? Math.max(...items.map(s => s.id)) + 1 : 1
  };
  items.push(newItem);
  writeData(KEYS.SCHEDULE, items);

  // Auto create Binding if not exists
  const bindings = readData<TeacherSubjectGroup[]>(KEYS.BINDINGS, []);
  if (!bindings.some(b => b.teacherId === item.teacherId && b.subjectId === item.subjectId && b.groupId === item.groupId)) {
    bindings.push({
      id: bindings.length > 0 ? Math.max(...bindings.map(b => b.id)) + 1 : 1,
      teacherId: item.teacherId,
      subjectId: item.subjectId,
      groupId: item.groupId
    });
    writeData(KEYS.BINDINGS, bindings);
  }

  notifyDbChanged();
  return newItem;
};
export const updateScheduleItem = (id: number, item: Omit<ScheduleItem, 'id'>): void => {
  const items = readData<ScheduleItem[]>(KEYS.SCHEDULE, []);
  const idx = items.findIndex(s => s.id === id);
  if (idx !== -1) {
    items[idx] = { ...item, id };
    writeData(KEYS.SCHEDULE, items);
    notifyDbChanged();
  }
};
export const deleteScheduleItem = (id: number): void => {
  let items = readData<ScheduleItem[]>(KEYS.SCHEDULE, []);
  items = items.filter(s => s.id !== id);
  writeData(KEYS.SCHEDULE, items);
  notifyDbChanged();
};
