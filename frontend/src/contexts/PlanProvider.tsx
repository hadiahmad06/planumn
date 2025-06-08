"use client";

import { useEffect, useState } from "react";
import { PlanContext } from "@/contexts/PlanContext";
import { CourseDetails, CourseStub, Plan, PlannedCourse, PlanNullable } from "@/types/plan";
import { getCourseDetails } from "@/types/planHandlers";

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
    const [plan, setPlan] = useState<PlanNullable | null>(null);
    const [cachedCourses, setCachedCourses] = useState<Record<number, PlannedCourse>>({});
    const [planFetched, setPlanFetched] = useState<boolean>(false);
    const [changesSaved, setChangesSaved] = useState<boolean>(true);
    const [cachedSearchResults, setCachedSearchResults] = useState<Record<number, CourseStub>>({});

    // Load from localStorage on mount
    useEffect(() => {
        const storedPlan = localStorage.getItem("plan");
        if (storedPlan) {
            setPlan(JSON.parse(storedPlan) as Plan);
        }
        setPlanFetched(true);
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!changesSaved) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [changesSaved]);

    // Save to localStorage, update cache, and trigger autosave changesSaved status on update.
    useEffect(() => {
        localStorage.setItem("plan", JSON.stringify(plan));
        if (plan) {
            const allCourses = plan.semesters.flatMap(sem => sem.courses);
            Promise.all(allCourses.map(course => getCourseDetails(String(course.id))))
            .then(detailsArr => {
                const detailsMap: Record<number, PlannedCourse> = {};
                detailsArr.forEach((details, idx) => {
                detailsMap[allCourses[idx].id] = details;
                });
                setCachedCourses(detailsMap);
            });
            
        } else {
            setCachedCourses({});
            setChangesSaved(true);
        }
        console.log(cachedCourses);
    }, [plan]);

    return (
        <PlanContext.Provider
            value={{
                plan,
                setPlan,
                cachedCourses,
                setCachedCourses,
                planFetched,
                changesSaved,
                cachedSearchResults,
                setCachedSearchResults
            }}
        >
            {children}
        </PlanContext.Provider>
    );
};
