export type LockType = "locked" | "unlocked" | "autofilled";

export type Course = {
  id: number;
  lock: LockType;
}

export interface CourseDetails extends Course {
  campus: string;
  dept_abbr: string;
  course_num: string;
  class_desc: string;
  total_students: number;
  total_grades: number;
  onestop: string;
  onestop_desc: string;
  cred_min: number;
  cred_max: number;
  srt_vals: string;
};

// Distribution is the distribution of grades for a course
// isSummary is used to make the bar chart larger when showing summary information,
// unless it's being rendered on a mobile device.
  export interface Distribution {
    grades: {
      [grade: string]: number; // Accepts any grade key like 'A', 'B+', 'P', 'S', etc.
    };
    isSummary: boolean;
  }



export interface Semester {
  index: string;
  courses: Course[];
}

export interface SemesterDetails {
  index: string;
  courses: CourseDetails[];
}

export interface Plan {
  id: string;
  user_id: string;
  createdAt: Date;
  major: string[];
  semesters: Semester[];
} 

export interface PlanNullable {
  id: string | null;
  user_id: string | null;
  createdAt: Date | null;
  major: string[];
  semesters: Semester[];
}

export interface PlanDetails {
  id: string;
  user_id: string | null;
  createdAt: Date;
  major: string[];
  semesters: SemesterDetails[];
}

export type ColorKey = "none" | "department" | "level";