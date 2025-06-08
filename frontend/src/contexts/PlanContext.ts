"use client";

import { createContext } from "react";
import { CourseDetails, CourseStub, Plan, PlannedCourse, PlanNullable, QueriedCourse } from "@/types/plan";

export const PlanContext = createContext<{
    plan: PlanNullable | null
    setPlan: (plan: PlanNullable | null) => void;
    cachedCourses: Record<number, PlannedCourse>
    setCachedCourses: (courses: Record<number, PlannedCourse>) => void;
    planFetched: boolean;
    changesSaved: boolean;
    cachedSearchResults: Record<number, CourseStub>;
    setCachedSearchResults: (courses: Record<number, CourseStub>) => void;
}>({
    plan: null,
    setPlan: () => {
        console.warn("setPlan not implemented in context");
    },
    cachedCourses: {},
    setCachedCourses: () => {
        console.warn("setCachedCourses not implemented in context");
    },
    planFetched: false,
    changesSaved: true,
    cachedSearchResults: {},
    setCachedSearchResults: () => {
        console.warn("setCachedSearchResults not implemented in context");
    }
});
