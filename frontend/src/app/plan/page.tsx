"use client";

import { UserSessionContext } from "@/contexts/UserSessionContext";
import { useEffect, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Paper, Stack, Text, Box, Title, Collapse, Space, Loader } from "@mantine/core";
import { IconTrash, IconChevronDown } from "@tabler/icons-react";
import { CourseMetadata, Plan, PlanNullable, Semester } from "@/types/plan";
import AnimatedTypingText from "@/components/atoms/landing/AnimatedTypingTest";
import PlanRow, { PlanRowSkeleton } from "@/components/molecules/PlanRow";
import { MobileContext } from "@/contexts/MobileContext";

export default function PlanPage() {
  const { isMobile } = useContext(MobileContext);
  const { user } = useContext(UserSessionContext);

  const [plans, setPlans] = useState<PlanNullable[]>([]);
  const [creditMap, setCreditMap] = useState<Record<string, {id: number, cred_min: number, cred_max: number}>>({});
  const router = useRouter();
  const [showDeleted, setShowDeleted] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    fetch(`/api/plan/query`)
      .then((res) => res.json())
      .then(async (plansData: PlanNullable[]) => {
        const sortedPlans = plansData.sort(
          (a, b) =>
            new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        );
        setPlans(sortedPlans);

        const allCourseIds = new Set<number>();
        sortedPlans.forEach((plan: PlanNullable) => {
            (plan.semesters || []).forEach((sem: Semester) => {
                sem.courses.forEach((course: CourseMetadata) => {
                    allCourseIds.add(course.id);
                })
            });
        });
        // console.log(allCourseIds);
        const creditRes = await fetch(`/api/course/credits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(allCourseIds) }),
        });
        const creditData = await creditRes.json();

        const creditMap: Record<string, {id: number, cred_min: number, cred_max: number}> = {};
        creditData.forEach((course: any) => {
          creditMap[course.id] = course;
        });
        // console.log(creditMap);
        setCreditMap(creditMap);

      })
      .catch((err) => {
        console.error("Failed to fetch plans or course stubs:", err);
      });
  }, [user?.id]);
 
  const activePlans = plans.filter(plan => !plan.deletion_scheduled_at);
  const deletedPlans = plans.filter(plan => plan.deletion_scheduled_at);

  if (deletedPlans.length === 0 && showDeleted) setShowDeleted(false);

  return (
    <Stack w="100vw" style={{padding:"16px"}}>
      <Title
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "0.5rem",
        }}
      >
        <AnimatedTypingText blink={false}/>
      </Title>
      <Paper 
          w="100%" 
          radius="md" 
          shadow="sm"
          bg="rgba(129, 19, 49, 0.075)"
      >
        {/* Plans Section (not deleted) */}
        <Paper
        radius="md"
        shadow="sm"
        bg="rgba(129, 19, 49, 0.125)"
        style={{
            display: "grid",
            alignItems: "center",
            padding: isMobile ? "10px" : "20px",
            gridTemplateColumns: isMobile ? "27.5% 2.5% 25% 5% 30% 7.5% 2.5%" : "27.5% 2.5% 15% 5% 10% 10% 10% 10% 5% 5%",
        }}
        >
          <Text c="black" size={isMobile ? "sm" : "lg"} fw={800}>Plan Title</Text>
          <Space/>
          <Text c="black" size={isMobile ? "xs" : "md"} fw={600}>{isMobile ? "Credits Bar" : "Credit Completion"}</Text>
          <Space/>
          {!isMobile && <>
              <Text c="black" size="md" fw={600}># of Courses</Text>
              <Text c="black" size="md" fw={600}># of Credits</Text>
          </>}
          <Text c="black" size={isMobile ? "xs" : "md"} fw={600}>Last Updated</Text>
          {!isMobile &&
              <Text c="black" size="md" fw={600}>Created At</Text>
          }
          <Space/>
        </Paper>
        <Stack gap={isMobile ? "4px" : "8px"} style={{ padding: isMobile ? "4px" : "8px" }}>
          {activePlans.length !== 0 ? activePlans.map((plan, index) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              creditMap={creditMap}
              index={index}
              isDeleted={false}
              onDelete={() => {
                fetch("/api/plan/delete", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ planId: plan.id }),
                }).then((res) => {
                  if (res.ok) {
                    setPlans((prev) => 
                      prev.map((p) => {
                        if (p.id === plan.id) {
                          const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                          return { ...p, deletion_scheduled_at: in30Days }
                        } else {
                          return p;
                        }
                      })
                    );
                  } else {
                    console.error("Failed to delete plan");
                  }
                });
              }}
              onClick={() => router.push(`/plan/${plan.id}`)}
            />
          )) : (
            <>
            <PlanRowSkeleton index={0} />
            <PlanRowSkeleton index={1} />
            <PlanRowSkeleton index={2} />
            </>
          )}
        </Stack>
        {/* Deleted Plans Section Toggle */}
        <Paper
          radius="md"
          shadow="sm"
          bg="rgba(129, 19, 49, 0.15)"
          style={{
            display: "grid",
            alignItems: "center",
            paddingBlock: isMobile ? (showDeleted ? "12px" : "8px") : (showDeleted ? "20px" : "10px"),
            paddingInline: "20px",
            gridTemplateColumns: isMobile ? "27.5% 2.5% 25% 5% 30% 7.5% 2.5%" : "27.5% 2.5% 15% 5% 10% 10% 10% 10% 5% 5%",
            cursor: "pointer",
            userSelect: "none",
            transition: "padding-block 0.2s ease",
          }}
          onClick={() => setShowDeleted((prev) => !prev)}
        >
          <Text c="black" size={isMobile ? "xs" : "lg"} fw={800} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
          }}>
            {isMobile ? `${deletedPlans.length} Deleted` : `Deleted Plans (${deletedPlans.length})`}
            <IconChevronDown
              size={isMobile ? 12 : 20}
              style={{
                transform: showDeleted ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </Text>
          <Space/>
          <Text 
            size={isMobile ? "xs" : "md"}
            c="black" 
            fw={600}
            style={{
                opacity: showDeleted ? 1 : 0,
                transition: "opacity 0.2s ease",
            }}
          >
            {isMobile ? "Deleted On" :"Will Be Deleted On"}
          </Text>
        </Paper>
        <Collapse in={showDeleted} transitionDuration={200} transitionTimingFunction="ease">
          <Stack gap="xs" style={{ padding: "8px" }}>
            {deletedPlans.map((plan, index) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                creditMap={creditMap}
                index={index}
                isDeleted={true}
                onRecover={() => {
                  fetch("/api/plan/recover", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ planId: plan.id }),
                  }).then((res) => {
                    if (res.ok) {
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, deletion_scheduled_at: null } : p
                        )
                      );
                    } else {
                      console.error("Failed to recover plan");
                    }
                  });
                }}
              />
            ))}
          </Stack>
        </Collapse>
      </Paper>
    </Stack>
  );
}
