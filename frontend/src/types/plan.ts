export type LockType = "locked" | "unlocked" | "autofilled";

// for query only
export type Course = {
  id: number;
}

// edge cases, lock type
export type Metadata = {
  lock: LockType
}

// for planned save and read only
export type CourseMetadata = Course & Metadata;

// for search results only
export interface CourseStub extends Course {
  dept_abbr: string;
  course_num: string;
}

// for CoursePreview
export interface CourseDetails extends CourseStub {
  campus: string;
  class_desc: string;
  total_students: number;
  total_grades: number;
  onestop: string;
  onestop_desc: string;
  cred_min: number;
  cred_max: number;
  srt_vals: string;
}

// search only
export type QueriedCourse = CourseDetails

// also includes metadata (edge cases, lock type)
export type PlannedCourse = Metadata & CourseDetails;

// Distribution is the distribution of grades for a course
// isSummary is used to make the bar chart larger when showing summary information,
// unless it's being rendered on a mobile device.
  export interface Distribution {
    grades: {
      [grade: string]: number; // Accepts any grade key like 'A', 'B+', 'P', 'S', etc.
    };
    isSummary: boolean;
  }



export type Semester ={
  index: string;
  courses: CourseMetadata[];
}

// export interface SemesterDetails {
//   index: string;
//   courses: PlannedCourse[];
// }

export interface Plan {
  id: string;
  user_id: string;
  created_at: Date;
  last_updated: Date;
  can_view: string[]
  title: string;
  programs: string[];
  semesters: Semester[];
} 

export interface PlanNullable {
  id: string | null;
  user_id: string | null;
  created_at: Date;
  last_updated: Date;
  can_view: string[]
  title: string;
  programs: string[];
  semesters: Semester[];
}

// export interface PlanDetails {
//   id: string;
//   user_id: string | null;
//   createdAt: Date;
//   major: string[];
//   semesters: SemesterDetails[];
// }

export type ColorKey = "none" | "department" | "level";

export function isPlanEmpty(plan: PlanNullable | Plan): boolean {
  if (plan.semesters.length === 0) return true;
  return plan.semesters.every(sem => sem.courses.length === 0);
}