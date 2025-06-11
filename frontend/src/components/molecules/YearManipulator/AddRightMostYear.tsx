import { Plan, PlanNullable, Semester } from "@/types/plan";

export function AddRightmostYear(plan: PlanNullable, setPlan: (plan: Plan) => void) {
      
      if (!plan || !plan.semesters) {
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
      
      const latestYear = Math.max(...years);
      const nextYear = latestYear + 1;
      const nextYearShort = nextYear.toString().slice(2);
      const latestYearShort = latestYear.toString().slice(2);

      // Create new semesters
      const newSemesters: Semester[] = [
        { index: `1${latestYearShort}9`, courses: [] }, // Fall of next year
        { index: `1${nextYearShort}3`, courses: [] }, // Spring of next year
        { index: `1${nextYearShort}5`, courses: [] }, // Summer of next year
      ];

      // Append new semesters after the existing ones and sort
      const updatedSemesters = [...newSemesters, ...plan.semesters];
    
      console.log("Original semesters:", plan.semesters.map(s => s.index));
      console.log("Updated semesters:", updatedSemesters.map(s => s.index));
    
      setPlan({
        ...plan,
        id: plan.id ?? "",
        user_id: plan.user_id ?? "",
        semesters: updatedSemesters
      });
    }
