export interface ApplicationUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Teacher' | 'Student';
}

export interface Group {
  id: number;
  name: string;
  course: number;
}

export interface Subject {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  fullName: string;
  groupId: number;
  applicationUserId: string;
}

export interface Teacher {
  id: number;
  fullName: string;
  applicationUserId: string;
}

export interface Grade {
  id: number;
  studentId: number;
  subjectId: number;
  teacherId: number;
  value: number; // 0 to 100
  date: string;  // ISO string
  comment?: string;
}

export interface ScheduleItem {
  id: number;
  groupId: number;
  subjectId: number;
  teacherId: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  classroom: string;
}

export interface TeacherSubjectGroup {
  id: number;
  teacherId: number;
  subjectId: number;
  groupId: number;
}
