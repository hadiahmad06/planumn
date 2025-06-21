
import { PlanNullable, Semester} from "@/types/plan";
import {notifications, Notifications} from "@mantine/notifications";

function generateCurrentYear() : Semester[] { // User out of years and is adding years
    const date_object = new Date();
    const current_academic_year = date_object.getFullYear()
    let digits = parseInt(current_academic_year.toString().substring(2)) // 2025 --> 25
    return [{index: "1" + (digits - 1).toString() + "9", courses: []},
            {index: "1" + digits.toString() + "5", courses: []},
            {index: "1" + digits.toString() + "3", courses: []},
    ];
}
function generatePrevYear(firstIndex: string) {
    // ex 1259 --> 1249
    const idx = parseInt(firstIndex);
    let prev_fall_index = (idx-10).toString()
    let prev_Spring_index = (idx-6).toString()
    let prev_Summer_index = (idx-4).toString()

    // Make a semester array with index being prev year and courses being an empty array
    const prev_year: Semester[] = [{index: prev_fall_index, courses: []}, {index: prev_Spring_index, courses: []}, {index: prev_Summer_index, courses: []}]
    return prev_year
}
function generateNextYear(lastIndex: string) {
    // ex 1259 --> 1269
    const idx = parseInt(lastIndex);
    console.log(idx);
    let next_fall_index = (idx+6).toString()
    let next_Spring_index = (idx+12).toString()
    let next_Summer_index = (idx+10).toString()

    // Make a semester array with index being prev year and courses being an empty array
    const next_year: Semester[] = [{index: next_fall_index, courses: []}, {index: next_Spring_index, courses: []}, {index: next_Summer_index, courses: []}]
    return next_year
     
}
function error_message() {
    return notifications.show({
        color: "#811331",
        title: "No more Semesters",
        message: "You need to add semesters!! You are out Twiniante!"
    })
}

export default function ManipulateYear(plan: PlanNullable | null,setPlan: (plan: PlanNullable | null) => void,  manipulation: String) {
    if (!plan) return;
    const sems = [...plan.semesters];
    let updated: Semester[] = []

    if (manipulation == "AddPrecedingYear") {
        sems.length == 0 ? updated = generateCurrentYear() : updated = generatePrevYear(sems[0].index).concat(sems)

    }
    else if (manipulation == "RemovePrecedingYear") {
        sems.length == 0 ? error_message() : sems.length == 3 ? updated = [] : updated = sems.slice(3)


    } else if (manipulation == "AddLatestYear") {
        sems.length == 0 ? updated = generateCurrentYear() : updated = sems.concat(generateNextYear(sems[sems.length-1].index))

    } else if (manipulation == "RemoveLatestYear") {
        sems.length == 0 ? error_message() : sems.length == 3 ? updated = [] : updated = sems.slice(0, sems.length - 3)
    }
    setPlan({...plan, semesters: updated})
    console.log(sems)
    // }

        // },[plan, setPlan])
}
   
    

