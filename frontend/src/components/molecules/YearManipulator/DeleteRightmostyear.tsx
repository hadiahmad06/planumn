import { Plan, PlanNullable } from "@/types/plan";

export function DeleteRightmostYear(plan: PlanNullable, setPlan: (plan: Plan) => void) {
  if (!plan || !plan.semesters) {
    return;
  }
  
  // Find the latest year
  const years = Object.keys(plan.semesters.reduce((acc, sem) => {
    const year = parseInt('20' + sem.index.slice(1, 3), 10);
    acc[year] = true;
    return acc;
  }, {} as Record<number, boolean>)).map(Number);
  
  if (years.length === 0) {
    return;
  }
  
  const latestYear = Math.max(...years);
  
  // Filter out semesters based on the rules:
  // 1. Remove spring and summer semesters of latest year (season codes '3' and '5')
  // 2. Remove fall semester of the year before latest year (season code '9')
  const updatedSemesters = plan.semesters.filter(sem => {
    const semYear = parseInt('20' + sem.index.slice(1, 3), 10);
    const seasonCode = sem.index.slice(3); // '9' for Fall, '3' for Spring, '5' for Summer
    
    // For spring and summer, remove if they're from the latest year
    if (seasonCode === '3' || seasonCode === '5') {
      return semYear !== latestYear;
    }
    // For fall, remove if it's from the year before the latest year
    if (seasonCode === '9') {
      return semYear !== latestYear - 1;
    }
    return true;
  });

  setPlan({
    ...plan,
    id: plan.id ?? "",
    user_id: plan.user_id ?? "",
    semesters: updatedSemesters
  });
}









