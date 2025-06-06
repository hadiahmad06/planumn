"use client";

import { createContext } from "react";
import { CourseDetails, Plan } from "@/types/plan";

export const PlanContext = createContext<{
    plan: Plan | null
    setPlan: (plan: Plan | null) => void;
    planFetched: boolean
    cachedCourses: Record<number, CourseDetails>
    setCachedCourses: (courses: Record<number, CourseDetails>) => void;
}>({
    plan: null,
    setPlan: () => {
        console.warn("setPlan not implemented in context");
    },
    planFetched: false,
    cachedCourses: {},
    setCachedCourses: (courses: Record<number, CourseDetails>) => {
        console.warn("setCachedCourses not implemented in context");
    }
});

