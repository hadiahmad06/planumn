"use client";

import { useEffect, useState, useContext } from "react";
import { PlanContext } from "@/contexts/PlanContext";
import { CourseStub, Plan, PlannedCourse, PlanNullable } from "@/types/plan";
import { getCourseDetails } from "@/types/planHandlers";
import { UserSessionContext } from "@/contexts/UserSessionContext";
import { useRouter } from "next/navigation";

/**
 * Cache the planned courses for a plan.
 * @param plan The plan object (nullable)
 * @param setCachedCourses Setter for cached courses map
 */
export const cachePlannedCourses = async (
    plan: PlanNullable | null,
    setCachedCourses: (courses: Record<number, PlannedCourse>) => void
) => {
    if (!plan) return;
    const allCourses = plan.semesters.flatMap(sem => sem.courses);
    const detailsArr = await Promise.all(allCourses.map(course => getCourseDetails(String(course.id))));
    const detailsMap: Record<number, PlannedCourse> = {};
    detailsArr.forEach((details, idx) => {
        detailsMap[allCourses[idx].id] = details;
    });
    setCachedCourses(detailsMap);
};

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    const [remotePlan, setRemotePlan] = useState<PlanNullable | null>(null);

    const [plan, setPlan] = useState<PlanNullable | null>(null);
    const [cachedCourses, setCachedCourses] = useState<Record<number, PlannedCourse>>({});
    const [cachedSearchResults, setCachedSearchResults] = useState<Record<number, CourseStub>>({});

    const [planFetched, setPlanFetched] = useState<boolean>(false);
    const [changesSaved, setChangesSaved] = useState<boolean>(true);
    const [retryCount, setRetryCount] = useState<number>(0);

    const [error, setError] = useState<string>("");

    const { user, session } = useContext(UserSessionContext);

    // Load from localStorage on mount
    useEffect(() => {
        const storedPlan = localStorage.getItem("plan");
        if (storedPlan) {
            const parsedPlan = JSON.parse(storedPlan) as Plan;
            setPlan(parsedPlan);
            cachePlannedCourses(parsedPlan, setCachedCourses);
        }
        setPlanFetched(true);
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!changesSaved && session) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [changesSaved, session]);

    // Save to localStorage, update cache, and trigger changesSaved status on update.
    useEffect(() => {
        if (!plan) {
            if(planFetched) {
                setCachedCourses({});
                setChangesSaved(true);
                localStorage.removeItem("plan");
            }
            // wait until plan is fetched at least bro
            return;
        }
        
        const semestersChanged = JSON.stringify(remotePlan?.semesters) !== JSON.stringify(plan.semesters);
        const titleChanged = remotePlan?.title !== plan.title;
        const programsChanged = JSON.stringify(remotePlan?.programs) !== JSON.stringify(plan.programs);

        if (semestersChanged) {
            cachePlannedCourses(plan, setCachedCourses);
        }

        if (semestersChanged || titleChanged || programsChanged) {
            setChangesSaved(false);
            localStorage.setItem("plan", JSON.stringify(plan));
            if (retryCount > 0) setRetryCount(0);
        } else {
            localStorage.removeItem("plan");
        }
        // console.log(semestersChanged, changesSaved, retryCount)
    }, [plan]);

    useEffect(() => {
        if (changesSaved === false && retryCount < 6 && plan && !!session) {
            const planId = plan.id;
            fetch("/api/plan/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ...plan, user_id: plan.user_id || user?.id })
            })
            .then(res => {
                if (res.ok) {
                    res.json().then(data => {
                        setPlan({ 
                            ...plan, 
                            id: plan.id || data.id,
                            created_at: plan.created_at || data.last_updated, 
                            last_updated: data.last_updated 
                        });
                        setError("");
                        setRemotePlan(JSON.parse(JSON.stringify(plan)));
                        setChangesSaved(true);
                        if(!planId && !!data.id) {
                            router.replace(`/plan/${data.id}`);
                        }
                    });
                    
                    return;
                } else {
                    setError("Failed to save plan. Click to retry.")
                    console.error("Failed to save plan");
                }
            })
            .catch(err => {
                setError("Check network connection. Click to retry.")
                console.error("Error saving plan:", err);
            });
        }
    }, [changesSaved, retryCount, plan, session]);

    return (
        <PlanContext.Provider
            value={{
                plan,
                setPlan,
                remotePlan,
                setRemotePlan,
                cachedCourses,
                setCachedCourses,
                planFetched,
                cachedSearchResults,
                setCachedSearchResults,
                changesSaved,
                retryCount,
                setRetryCount,
                error
            }}
        >
            {children}
        </PlanContext.Provider>
    );
};
