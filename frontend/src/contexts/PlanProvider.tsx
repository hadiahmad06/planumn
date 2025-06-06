"use client";

import { useEffect, useState } from "react";
import { PlanContext } from "@/contexts/PlanContext";
import { CourseDetails, Plan } from "@/types/plan";
import { getCourseDetails } from "@/types/planHandlers";

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
    const [plan, setPlan] = useState<Plan | null>(null);
    const [planFetched, setPlanFetched] = useState<boolean>(false);
    const [cachedCourses, setCachedCourses] = useState<Record<number, CourseDetails>>({});

    // Load from localStorage on mount
    useEffect(() => {
        const storedPlan = localStorage.getItem("plan");
        if (storedPlan) {
            setPlan(JSON.parse(storedPlan) as Plan);
        }
        setPlanFetched(true);
    }, []);

    // Save to localStorage and updated cached on update.
    useEffect(() => {
        localStorage.setItem("plan", JSON.stringify(plan));
        if (plan) {
            const allCourses = plan.semesters.flatMap(sem => sem.courses);
            Promise.all(allCourses.map(course => getCourseDetails(String(course.id))))
            .then(detailsArr => {
                const detailsMap: Record<number, CourseDetails> = {};
                detailsArr.forEach((details, idx) => {
                detailsMap[allCourses[idx].id] = details;
                });
                setCachedCourses(detailsMap);
            });
        } else {
            setCachedCourses({});
        }
        console.log(cachedCourses);
    }, [plan]);

    useEffect(() => {

    })

    return (
        <PlanContext.Provider value={{ plan, setPlan, planFetched, cachedCourses, setCachedCourses}}>
            {children}
        </PlanContext.Provider>
    );
};
