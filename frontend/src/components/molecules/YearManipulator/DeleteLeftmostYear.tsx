import { Plan, PlanNullable } from "@/types/plan";

export function DeleteLeftmostYear(plan: PlanNullable, setPlan: (plan: Plan) => void) {
  console.log("DeleteLeftmostYear called with plan:", plan);
  
  if (!plan || !plan.semesters) {
    console.log("Early return - plan is null or missing semesters");
    return;
  }
  
  // Find the earliest year
  const years = Object.keys(plan.semesters.reduce((acc, sem) => {
    const year = parseInt('20' + sem.index.slice(1, 3), 10);
    acc[year] = true;
    return acc;
  }, {} as Record<number, boolean>)).map(Number);
  
  console.log("Found years:", years);
  
  if (years.length === 0) {
    console.log("No years found in plan");
    return;
  }
  
  const earliestYear = Math.min(...years);
  console.log("Earliest year:", earliestYear);
  
  // Filter out semesters based on the rules:
  // 1. Remove fall semester of earliest year (season code '9')
  // 2. Remove spring and summer semesters of earliest year + 1 (season codes '3' and '5')
  const updatedSemesters = plan.semesters.filter(sem => {
    const semYear = parseInt('20' + sem.index.slice(1, 3), 10);
    const seasonCode = sem.index.slice(3); // '9' for Fall, '3' for Spring, '5' for Summer
    
    console.log(`Processing semester ${sem.index}: year=${semYear}, seasonCode=${seasonCode}`);
    
    // Keep the semester if:
    // 1. It's not from the earliest year's fall semester (season code '9')
    // 2. It's not from the spring or summer semester of the year after the earliest year (season codes '3' and '5')
    const shouldKeep = !(semYear === earliestYear && seasonCode === '9') && 
                      !(semYear === earliestYear + 1 && (seasonCode === '3' || seasonCode === '5'));
    
    console.log(`Should keep semester ${sem.index}: ${shouldKeep}`);
    return shouldKeep;
  });

  console.log("Original semesters:", plan.semesters.map(s => s.index));
  console.log("Updated semesters:", updatedSemesters.map(s => s.index));

  setPlan({
    ...plan,
    id: plan.id ?? "",
    user_id: plan.user_id ?? "",
    semesters: updatedSemesters
  });
}









