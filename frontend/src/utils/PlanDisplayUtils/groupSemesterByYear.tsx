import { Semester } from "@/types/plan";

export function groupSemestersByYear(semesters: Semester[]) {
    const grouped: Record<string, { Fall?: Semester; Spring?: Semester; Summer?: Semester }> = {};
    const seasonLabels: Record<string, string> = { '9': 'Fall', '3': 'Spring', '5': 'Summer' };

    semesters.forEach((sem) => {
        const seasonCode = sem.index[3];
        const season = seasonLabels[seasonCode];
        if (!season) return;

        let year = parseInt('20' + sem.index.slice(1, 3), 10);
        if (season === 'Spring' || season === 'Summer') year -= 1;
        const yearStr = year.toString();

        if (!grouped[yearStr]) grouped[yearStr] = {};
        (grouped[yearStr] as any)[season] = sem;
    });

    return grouped;
}