
import { PlanNullable, Semester} from "@/types/plan";
import {notifications, Notifications} from "@mantine/notifications";

function Add_OutofYears() : Semester[] { //User out of years and is adding years
    const date_object = new Date();
    const current_academic_year = date_object.getFullYear()
    let digits = parseInt(current_academic_year.toString().substring(2)) // 2025 --> 25
    return [{index: "1" + (digits - 1).toString() + "9", courses: []},
            {index: "1" + digits.toString() + "5", courses: []},
            {index: "1" + digits.toString() + "3", courses: []},
    ];
}
function AddprevYear(sem: Semester[]) {
    // ex 1259 --> 1249
    let prev_fall_index = (parseInt(sem[0].index) - 10).toString()
    let prev_Spring_index = (parseInt(sem[1].index) - 10).toString()
    let prev_Summer_index = (parseInt(sem[2].index) - 10).toString()

    // Make a semester array with index being prev year and courses being an empty array
    const prev_year: Semester[] = [{index: prev_fall_index, courses: []}, {index: prev_Spring_index, courses: []}, {index: prev_Summer_index, courses: []}]
    return prev_year.concat(sem)
}
function AddnextYear(sem: Semester[]) {
   // ex 1259 --> 1269
    let next_fall_index = (parseInt(sem[0].index) + 10).toString()
    let next_Spring_index = (parseInt(sem[1].index) + 10).toString()
    let next_Summer_index = (parseInt(sem[2].index) + 10).toString()

    // Make a semester array with index being prev year and courses being an empty array
    const next_year: Semester[] = [{index: next_fall_index, courses: []}, {index: next_Spring_index, courses: []}, {index: next_Summer_index, courses: []}]
    return sem.concat(next_year)
     
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
    const sem = [...plan.semesters];
    let updated: Semester[] = []

    if (manipulation == "AddPreviousYear") {
        sem.length == 0 ? updated = Add_OutofYears() : updated = AddprevYear(sem)

    }
    else if (manipulation == "DeleteCurrentYear") { //The most current year in the semester list (not the current year we are living in)
        sem.length == 0 ? error_message() : updated = sem.slice(3)


    } else if (manipulation == "AddLatest+1Year") { //Adds year after latest year
        sem.length == 0 ? updated = Add_OutofYears() : updated = AddnextYear(sem)

    } else if (manipulation == "RemoveLatestYear") {
        sem.length == 0 ? error_message() : updated = sem.slice(0, sem.length - 3)
    }
    setPlan({...plan, semesters: updated})
    // }

        // },[plan, setPlan])
}
   
    

