import { CourseDetails, Semester } from "@/types/plan";

export async function getCourseDetails(id: string): Promise<CourseDetails | undefined> {
  const response = await fetch(`/api/course/full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: "id", ids: [id] }),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }

  const data: CourseDetails[] = await response.json();
  return data[0];
}

export async function fetchCourseDetailsFromId(ids: string[]): Promise<Record<number, CourseDetails>> {
  const response = await fetch(`/api/course/full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: "id", ids: ids }),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }

  const data: CourseDetails[] = await response.json();
  const courseMap: Record<number, CourseDetails> = {};

  for (const course of data) {
    courseMap[course.id] = course;
  }

  return courseMap;
}

export async function fetchCourseDetailsFromCd(ids: string[]): Promise<Record<string, CourseDetails>> {
  const response = await fetch(`/api/course/full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: "cd", ids: ids }),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }

  const data: CourseDetails[] = await response.json();
  const courseMap: Record<string, CourseDetails> = {};

  for (const course of data) {
    courseMap[course.courseGroupId] = course;
  }

  return courseMap;
}

export function normalizeSemesters(semesters: Semester[]): Semester[] {
  semesters.sort((a, b) => a.index.localeCompare(b.index));

  const indexes = semesters.map(s => parseInt(s.index));
  const minIndex = Math.min(...indexes);
  const maxIndex = Math.max(...indexes);

  const normMinIndex = minIndex % 10 === 3 ? minIndex - 4 :
                       minIndex % 10 === 5 ? minIndex - 6 :
                       minIndex;

  const normMaxIndex = maxIndex % 10 === 9 ? maxIndex + 6 :
                       maxIndex % 10 === 3 ? maxIndex + 2 :
                       maxIndex;

  const existingIndexes = new Set(semesters.map(s => s.index));

  for (let i = normMinIndex; i <= normMaxIndex; i++) {
    const suffix = i % 10;
    if ((suffix === 3 || suffix === 5 || suffix === 9) && !existingIndexes.has(i.toString())) {
      semesters.push({ index: i.toString(), courses: [] } as Semester);
    }
  }

  semesters.sort((a, b) => a.index.localeCompare(b.index));

  return semesters;
}
