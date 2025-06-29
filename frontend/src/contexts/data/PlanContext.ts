"use client";

import { createContext } from "react";
import { CourseDetails, CourseStub, Plan, PlannedCourse, PlanNullable, QueriedCourse } from "@/types/plan";

export const PlanContext = createContext<{
    plan: PlanNullable | null;
    setPlan: (plan: PlanNullable | null) => void;
    remotePlan: PlanNullable | null;
    setRemotePlan: (plan: PlanNullable | null) => void;
    cachedCourses: Record<number, PlannedCourse>;
    setCachedCourses: (courses: Record<number, PlannedCourse>) => void;
    cachedSearchResults: Record<number, CourseStub>;
    setCachedSearchResults: (courses: Record<number, CourseStub>) => void;
    planFetched: boolean;
    changesSaved: boolean;
    retryCount: number;
    setRetryCount: (retryCount: number) => void;
    error: string;
}>({
    plan: null,
    setPlan: () => {
        console.warn("setPlan not implemented in context");
    },
    remotePlan: null,
    setRemotePlan: () => {
        console.warn("setRemotePlan not implemented in context");
    },
    cachedCourses: {},
    setCachedCourses: () => {
        console.warn("setCachedCourses not implemented in context");
    },
    cachedSearchResults: {},
    setCachedSearchResults: () => {
        console.warn("setCachedSearchResults not implemented in context");
    },
    planFetched: false,
    changesSaved: true,
    retryCount: 0,
    setRetryCount: () => {
        console.warn("setRetryCount not implemented in context");
    },
    error: ""
});
