"use client";

import { UserSessionContext } from "@/contexts/UserSessionContext";
import { useEffect, useContext, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Progress, Paper, Group, Stack, Text, Box, Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { CourseMetadata, PlanNullable } from "@/types/plan";

export default function PlanPage() {
  const { user } = useContext(UserSessionContext);
  const [plans, setPlans] = useState<PlanNullable[]>([]);
  const [planData, setPlanData] = useState<Record<string, { courseCount: number; creditCount: number }>>({});
  const [pendingDelete, setPendingDelete] = useState<PlanNullable | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    fetch(`/api/plan/query?user_id=${user.id}`)
      .then((res) => res.json())
      .then(async (plansData) => {
        const sortedPlans = plansData.sort(
          (a: any, b: any) =>
            new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        );
        setPlans(sortedPlans);

        const allCourseIds = new Set<string>();
        sortedPlans.forEach((plan: any) => {
            (plan.semesters || []).forEach((course: CourseMetadata) => {
                allCourseIds.add(String(course.id));
            });
        });

        const creditRes = await fetch(`/api/course/credits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(allCourseIds) }),
        });
        const creditData = await creditRes.json();

        // let creditCount = 0;
        const creditMap: Record<string, any> = {};
        creditData.forEach((course: any) => {
        //   creditCount += stub.cred_min;
          creditMap[course.id] = course;
        });

      })
      .catch((err) => {
        console.error("Failed to fetch plans or course stubs:", err);
      });
  }, [user?.id]);

  return (
        <Stack w="100vw">
            <Text
                size="xl"
                mb="md"
            > My Plans </Text>
            <Paper 
                w="100%" 
                radius="md" 
                bg="rgba(129, 19, 49, 0.1)"
            >
                <Paper
                    radius="md"
                    shadow="sm"
                    bg="rgba(129, 19, 49, 0.3)"
                    style={{
                        display: "grid",
                        alignItems: "center",
                        padding: "20px",
                        gridTemplateColumns: "30% 10% 10% 15% 15% 15% 5%",
                    }}
                >
                    <Text c="white" size="lg" fw={800}>Plan Title</Text>
                    <Text c="white" fw={900}># of Courses</Text>
                    <Text c="white" fw={900}># of Credits</Text>
                    {/* <Text c="white" fw={900}>Progress</Text> */}
                    <Text c="white" fw={900}>Last Updated</Text>
                    <Text c="white" fw={900}>Created At</Text>
                    {/* <Text style={{ width: "32px" }} /> */}
                </Paper>
                <Stack gap="xs" style={{ padding: "8px" }}>
                    {plans.map((plan, index) => {
                        const courseCount = 0
                        const creditCount = 0 
                        const progressPercent = Math.min((creditCount / 120) * 100, 100);
                        const bgColor = index % 2 === 0 ? "rgba(255,255,255,0.3)" : "rgba(220,220,220,0.3)";
                        return (
                        <Paper
                            key={plan.id}
                            radius="md"
                            style={{
                                boxShadow: "0 0px 4px rgba(0,0,0,0.1)",
                                display: "grid",
                                alignItems: "center",
                                padding: "12px 12px",
                                backgroundColor: bgColor,
                                transition: "padding 0.25s, box-shadow 0.25s, background-color 0.25s",
                                cursor: "pointer",
                                gridTemplateColumns: "30% 10% 10% 15% 15% 15% 5%",
                            }}
                            onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.padding = "30px 12px";
                                el.style.boxShadow = "0 0px 4px 2px rgba(0,0,0,0.1)";
                                el.style.backgroundColor = index % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(220,220,220,0.6)";
                            }}
                            onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.padding = "12px 12px";
                                el.style.boxShadow = "0 0px 4px rgba(0,0,0,0.1)";
                                el.style.backgroundColor = bgColor;
                            }}
                            onClick={(e) => {
                                if ((e.target as HTMLElement).dataset.trash === "true") return;
                                router.push(`/plan/${plan.id}`);
                            }}
                        >
                            <Text fw={600} size="md" truncate="end">{plan.title}</Text>
                            <Text size="sm">
                              <span style={{ fontWeight: 500 }}>{courseCount}</span> <span style={{ color: "#868e96" }}>courses</span>
                            </Text>
                            <Text size="sm">
                              <span style={{ fontWeight: 500 }}>{creditCount}</span> <span style={{ color: "#868e96" }}>credits</span>
                            </Text>
                            {/* <Progress
                            value={progressPercent}
                            size="sm"
                            style={{ minWidth: 0, margin: "0 12px" }}
                            /> */}
                            <Text size="sm" c="dimmed">
                              {new Date(plan.last_updated).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {new Date(plan.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </Text>
                            <Box
                                component="button"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    border: "none",
                                    cursor: "pointer",
                                    background: "transparent",
                                    padding: 0,
                                    marginLeft: "auto",
                                    transition: "transform 0.15s ease, color 0.2s ease",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetch("/api/plan/delete", {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ planId: plan.id }),
                                  }).then((res) => {
                                    if (res.ok) {
                                      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
                                    } else {
                                      console.error("Failed to delete plan");
                                    }
                                  });
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "scale(1.3)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                                }}
                                >
                                <IconTrash size={32} color="gray" />
                                </Box>
                        </Paper>
                        );
                    })}
                </Stack>
            </Paper>
        </Stack>
    );
}
