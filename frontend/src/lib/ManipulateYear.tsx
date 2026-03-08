import { PlanNullable, Semester } from "@/types/plan";
import { notifications } from "@mantine/notifications";

function generateCurrentYear(): Semester[] {
    const date_object = new Date();
    const current_academic_year = date_object.getFullYear();
    const digits = parseInt(current_academic_year.toString().substring(2));
    return [{ index: "1" + (digits - 1).toString() + "9", courses: [] },
            { index: "1" + digits.toString() + "5", courses: [] },
            { index: "1" + digits.toString() + "3", courses: [] },
    ];
}

function generatePrevYear(firstIndex: string): Semester[] {
    const idx = parseInt(firstIndex);
    const prev_fall_index = (idx - 10).toString();
    const prev_Spring_index = (idx - 6).toString();
    const prev_Summer_index = (idx - 4).toString();

    return [
        { index: prev_fall_index, courses: [] },
        { index: prev_Spring_index, courses: [] },
        { index: prev_Summer_index, courses: [] }
    ];
}

function generateNextYear(lastIndex: string): Semester[] {
    const idx = parseInt(lastIndex);
    const next_fall_index = (idx + 4).toString();
    const next_Spring_index = (idx + 8).toString();
    const next_Summer_index = (idx + 10).toString();

    return [
        { index: next_fall_index, courses: [] },
        { index: next_Spring_index, courses: [] },
        { index: next_Summer_index, courses: [] }
    ];
}

function error_message() {
    return notifications.show({
        color: "#811331",
        title: "No more Semesters",
        message: "You need to add semesters!! You are out Twiniante!"
    });
}

export default function ManipulateYear(plan: PlanNullable | null, setPlan: (plan: PlanNullable | null) => void, manipulation: string) {
    if (!plan) return;
    const sems = [...plan.semesters];
    let updated: Semester[] = [];

    if (manipulation === "AddPrecedingYear") {
        updated = sems.length === 0 ? generateCurrentYear() : generatePrevYear(sems[0].index).concat(sems);
    } else if (manipulation === "RemovePrecedingYear") {
        if (sems.length === 0) {
            error_message();
            return;
        }
        updated = sems.length === 3 ? [] : sems.slice(3);
    } else if (manipulation === "AddLatestYear") {
        const maxIndex = sems.reduce((max, s) => parseInt(s.index) > max ? parseInt(s.index) : max, -Infinity);
        updated = sems.length === 0 ? generateCurrentYear() : sems.concat(generateNextYear(maxIndex.toString()));
    } else if (manipulation === "RemoveLatestYear") {
        if (sems.length === 0) {
            error_message();
            return;
        }
        updated = sems.length === 3 ? [] : sems.slice(0, sems.length - 3);
    }
    setPlan({ ...plan, semesters: updated });
}
