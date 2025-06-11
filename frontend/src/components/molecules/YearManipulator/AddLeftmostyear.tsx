import { Plan, PlanNullable, Semester } from "@/types/plan";

export function AddLeftmostYear(plan: PlanNullable, setPlan: (plan: Plan) => void) {
      console.log("AddLeftmostYear called with plan:", plan);
      
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
      const prevYear = earliestYear - 1;
      const prevYearShort = prevYear.toString().slice(2);
      const earliestYearShort = earliestYear.toString().slice(2);

      // Create new semesters
      const newSemesters: Semester[] = [
        { index: `1${prevYearShort}9`, courses: [] }, // Fall of previous year
        { index: `1${earliestYearShort}3`, courses: [] }, // Spring of earliest year
        { index: `1${earliestYearShort}5`, courses: [] }, // Summer of earliest year
      ];

      // Insert new semesters before the existing ones (sorted order)
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
