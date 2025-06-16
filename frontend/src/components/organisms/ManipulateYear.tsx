import { PlanNullable, Semester } from "@/types/plan";

function prevYear(sem: Semester[]) {
    // ex 1259 --> 1249
    let prev_fall_index = (parseInt(sem[0].index) - 10).toString()
    let prev_Spring_index = (parseInt(sem[1].index) - 10).toString()
    let prev_Summer_index = (parseInt(sem[2].index) - 10).toString()

    // Make an semester array with index being prev year and courses being an empty array
    const prev_year: Semester[] = [{index: prev_fall_index, courses: []}, {index: prev_Spring_index, courses: []}, {index: prev_Summer_index, courses: []}]
    return prev_year.concat(sem)
    
    
}

function nextYear(sem: Semester[]) {
   // ex 1259 --> 1269
    let next_fall_index = (parseInt(sem[0].index) + 10).toString()
    let next_Spring_index = (parseInt(sem[1].index) + 10).toString()
    let next_Summer_index = (parseInt(sem[2].index) + 10).toString()

    // Make an semester array with index being prev year and courses being an empty array
    const next_year: Semester[] = [{index: next_fall_index, courses: []}, {index: next_Spring_index, courses: []}, {index: next_Summer_index, courses: []}]
    return next_year.concat(sem)
     
}

export default function ManipulateYear( plan: PlanNullable, manipulation: String) {
    if (manipulation == "DeleteTopYear") {
        if (plan.semesters.length == 0) {
            return alert("You deleted everything twiniante wtf")
        }
        console.log("This function was run")
        plan.semesters = plan.semesters.slice(3, plan.semesters.length)
        return

    } else if (manipulation == "AddTopYear") {
        plan.semesters = prevYear(plan.semesters)
        console.log("Added prev type shiii")
        return

    } else if (manipulation == "RemoveBottomYear") {
        plan.semesters = plan.semesters.slice(0, plan.semesters.length - 3)
        return
    }
    else if (manipulation == "AddBottomYear") {
        plan.semesters = nextYear(plan.semesters)
        console.log("Added Next year semster type shit")
        return
    }

    
}
   
    

