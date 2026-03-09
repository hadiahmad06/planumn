import { Semester, PlanNullable, CourseMetadata } from "@/types/plan";

export type Season = "Fall" | "Spring" | "Summer";
export const SEASON_CODES: Record<Season, number> = {
  Fall: 9,
  Spring: 3,
  Summer: 5,
};
export const SEASON_LABELS: Record<number, string> = {
  9: "Fall",
  3: "Spring",
  5: "Summer",
};

export interface SemesterInfo {
  index: string;
  season: Season;
  year: number;
  academicYear: number;
}

export function parseSemesterIndex(index: string): SemesterInfo | null {
  const seasonCode = parseInt(index[0], 10);
  const year = parseInt("20" + index.slice(1, 3), 10);

  if (!SEASON_LABELS[seasonCode]) {
    return null;
  }

  const season = SEASON_LABELS[seasonCode] as Season;
  const academicYear = season === "Spring" || season === "Summer" ? year - 1 : year;

  return {
    index,
    season,
    year,
    academicYear,
  };
}

export function createSemesterIndex(season: Season, year: number): string {
  const seasonCode = SEASON_CODES[season];
  const yearShort = year.toString().slice(-2);
  return `${seasonCode}${yearShort}`;
}

export function getNextSemester(currentIndex: string): string | null {
  const current = parseSemesterIndex(currentIndex);
  if (!current) return null;

  const seasonOrder: Season[] = ["Fall", "Spring", "Summer"];
  const currentIndexInOrder = seasonOrder.indexOf(current.season);

  if (currentIndexInOrder === -1) return null;

  let nextSeasonIndex = currentIndexInOrder + 1;
  let nextYear = current.year;

  if (nextSeasonIndex >= seasonOrder.length) {
    nextSeasonIndex = 0;
    nextYear += 1;
  }

  return createSemesterIndex(seasonOrder[nextSeasonIndex], nextYear);
}

export function getPreviousSemester(currentIndex: string): string | null {
  const current = parseSemesterIndex(currentIndex);
  if (!current) return null;

  const seasonOrder: Season[] = ["Fall", "Spring", "Summer"];
  const currentIndexInOrder = seasonOrder.indexOf(current.season);

  if (currentIndexInOrder === -1) return null;

  let prevSeasonIndex = currentIndexInOrder - 1;
  let prevYear = current.year;

  if (prevSeasonIndex < 0) {
    prevSeasonIndex = seasonOrder.length - 1;
    prevYear -= 1;
  }

  return createSemesterIndex(seasonOrder[prevSeasonIndex], prevYear);
}

export function getSameSeasonNextYear(currentIndex: string): string | null {
  const current = parseSemesterIndex(currentIndex);
  if (!current) return null;

  return createSemesterIndex(current.season, current.year + 1);
}

export function getSameSeasonPreviousYear(currentIndex: string): string | null {
  const current = parseSemesterIndex(currentIndex);
  if (!current) return null;

  return createSemesterIndex(current.season, current.year - 1);
}

export function getSeasonInAcademicYear(currentIndex: string, targetSeason: Season): string | null {
  const current = parseSemesterIndex(currentIndex);
  if (!current) return null;

  return createSemesterIndex(targetSeason, current.year);
}

export function findSemester(plan: PlanNullable, index: string): Semester | undefined {
  return plan.semesters.find((sem) => sem.index === index);
}

export function moveCourseBetweenSemesters(
  plan: PlanNullable,
  courseId: number,
  fromSemesterIndex: string,
  toSemesterIndex: string
): PlanNullable {
  const updated = { ...plan, semesters: [...plan.semesters] };

  const fromSem = updated.semesters.find((s) => s.index === fromSemesterIndex);
  const toSem = updated.semesters.find((s) => s.index === toSemesterIndex);

  if (!fromSem || !toSem) {
    return plan;
  }

  const courseIndex = fromSem.courses.findIndex((c) => c.id === courseId);
  if (courseIndex === -1) {
    return plan;
  }

  const [course] = fromSem.courses.splice(courseIndex, 1);
  toSem.courses.push(course);

  return updated;
}

export function deleteCourseFromSemester(plan: PlanNullable, courseId: number, semesterIndex: string): PlanNullable {
  const updated = { ...plan, semesters: [...plan.semesters] };

  const sem = updated.semesters.find((s) => s.index === semesterIndex);
  if (!sem) {
    return plan;
  }

  sem.courses = sem.courses.filter((c) => c.id !== courseId);

  return updated;
}

export function addCourseToSemester(
  plan: PlanNullable,
  course: CourseMetadata,
  semesterIndex: string
): PlanNullable | null {
  const updated = { ...plan, semesters: [...plan.semesters] };

  const sem = updated.semesters.find((s) => s.index === semesterIndex);
  if (!sem) {
    return null;
  }

  sem.courses.push(course);
  return updated;
}

export function ensureSemesterExists(plan: PlanNullable, semesterIndex: string): PlanNullable {
  const existing = findSemester(plan, semesterIndex);
  if (existing) {
    return plan;
  }

  const semesterInfo = parseSemesterIndex(semesterIndex);
  if (!semesterInfo) {
    return plan;
  }

  const newSemester: Semester = {
    index: semesterIndex,
    courses: [],
  };

  return {
    ...plan,
    semesters: [...plan.semesters, newSemester].sort((a, b) => a.index.localeCompare(b.index)),
  };
}