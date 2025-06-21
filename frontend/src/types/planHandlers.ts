import { PlanContext } from "@/contexts/PlanContext";
import { Semester } from "@/types/plan";
import { useContext } from "react";

export async function getCourseDetails(id:string) {
  const response = await fetch(`/api/course/full?id=${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }
  return response.json();
}

export function updateLock(semIndex: string, j: number){
  const { plan, setPlan } = useContext(PlanContext);
  if (!plan) return;

  const updated = [...plan.semesters];
  const semIdx = updated.findIndex(s => s.index === semIndex);
  // const courseIdx = updated[semIdx].courses.findIndex(c => c.id === course.id);

  const currentLock = updated[semIdx].courses[j].lock;
  updated[semIdx].courses[j].lock =
  currentLock === "locked" ? "unlocked" : "locked";
  setPlan({ ...plan, semesters: updated });
}


export function normalizeSemesters(semesters: Semester[]) {
  semesters.sort((a, b) => a.index.localeCompare(b.index));

  // gets earliest and latest semester index
  const indexes = semesters.map(s => parseInt(s.index));
  const minIndex = Math.min(...indexes);
  const maxIndex = Math.max(...indexes);

  // earliest fall
  const normMinIndex = minIndex % 10 === 3 ? minIndex - 4 :
                       minIndex % 10 === 5 ? minIndex - 6 :
                       minIndex;

  // latest summer
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