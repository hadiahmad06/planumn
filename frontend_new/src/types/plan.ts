export type CourseCardCourse = {
  subject: string;
  number: string;
  title: string;
  credits: number;
  lock?: string;
};

export interface Course extends CourseCardCourse {
  lock?: "locked" | "unlocked" | "autofilled";
}

export interface Semester {
  index: string;
  courses: Course[];
}

export interface Plan {
  createdAt: Date;
  major: string[];
  semesters: Semester[];
} 

export type ColorKey = "none" | "department" | "level";