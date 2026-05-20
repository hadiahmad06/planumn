"use client";

import {
  DragDropContext,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Box,
  Flex,
  Text,
  Skeleton,
  Menu,
  ScrollArea,
} from "@mantine/core";

import CourseCard from "../../molecules/CourseCard";
import { CourseMetadata, QueriedCourse, Semester } from "@/types/plan";
import { useContext, useEffect, useState } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import TopBar from "./TopBar";
import PlanHeader from "../../atoms/PlanHeader";
import { IconPlus } from "@tabler/icons-react";
import { MobileContext } from "@/contexts/visual/MobileContext";
import {
  DisplaySettingsContext,
  isSemesterHidden,
} from "@/contexts/visual/DisplaySettingsContext";
import PlanDisplayMobile from "./PlanDisplayMobile";
import AdvisorChat from "@/components/organisms/AdvisorChat";
import Rail from "./Rail";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";
import planDisplayClasses from "./PlanDisplay.module.css";

function semesterLabel(index: string): string {
  const yy = parseInt(index.slice(1, 3), 10);
  const season = index[3];
  if (season === "9") return `Fall ${2000 + yy}`;
  if (season === "3") return `Spring ${2000 + yy - 1}`;
  if (season === "5") return `Summer ${2000 + yy - 1}`;
  return index;
}

function nextSemesterIndex(index: string): string {
  const decade = index[0];
  const yy = index.slice(1, 3);
  const season = index[3];
  if (season === "9") {
    const nyy = (parseInt(yy, 10) + 1).toString().padStart(2, "0");
    return `${decade}${nyy}3`;
  }
  if (season === "3") {
    return `${decade}${yy}5`;
  }
  return `${decade}${yy}9`;
}


export default function PlanDisplay() {
  const { isMobile } = useContext(MobileContext);
  const { plan, setPlan, cachedCourses, setCachedCourses } =
    useContext(PlanContext);
  const { cachedReqCourses } = useContext(PlanAuditContext);

  const handleDragEnd = (result: DropResult) => {
    if (!plan) return;
    const { source, destination } = result;
    if (!destination) return;

    const updated = [...plan.semesters];
    const destSem = updated.find((sem) => sem.index === destination.droppableId);
    if (!destSem) return;
    const courses: CourseMetadata[] = destSem.courses;

    if (source.droppableId === "search") {
      const courseData = JSON.parse(result.draggableId) as QueriedCourse;
      courses.splice(destination.index, 0, {
        ...courseData,
        lock: "unlocked",
      });
      // Best-effort: hydrate the stub into a full CourseDetails so the
      // schedule card shows credits, height, grade dist, etc.
      void (async () => {
        try {
          const res = await fetch(`/api/course/full`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [String((courseData as any).id)] }),
          });
          if (!res.ok) return;
          const rows = (await res.json()) as any[];
          const full = rows?.[0];
          if (!full) return;
          setCachedCourses({
            ...cachedCourses,
            [full.id]: { ...full, lock: "unlocked" },
          });
        } catch {
          /* silent — card falls back to the stub */
        }
      })();
    } else if (source.droppableId === "rail") {
      // draggableId format: `rail-<reqIdx>-<ruleIdx>-<leafId>-<idx>`
      const parts = result.draggableId.split("-");
      const leafId = parts[3];
      const details = cachedReqCourses[leafId];
      if (!details) return;
      courses.splice(destination.index, 0, {
        ...details,
        lock: "unlocked",
      } as any);
      // Hydrate cachedCourses so the schedule card renders without a Skeleton.
      setCachedCourses({
        ...cachedCourses,
        [details.id]: { ...details, lock: "unlocked" } as any,
      });
    } else {
      const sourceSem = updated.find(
        (sem) => sem.index === source.droppableId
      );
      if (!sourceSem) return;
      const [moved] = sourceSem.courses.splice(source.index, 1);
      courses.splice(destination.index, 0, moved);
    }

    setPlan({ ...plan, semesters: updated });
  };

  return (
    <DragDropContext
      onDragStart={() =>
        window.dispatchEvent(new CustomEvent("planumn:dragstart"))
      }
      onDragEnd={(result) => {
        window.dispatchEvent(new CustomEvent("planumn:dragend"));
        handleDragEnd(result);
      }}
    >
      {isMobile ? <PlanDisplayMobile /> : <PlanDisplayDesktop />}
    </DragDropContext>
  );
}

export function PlanDisplayDesktop() {
  const { plan, setPlan } = useContext(PlanContext);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!plan) return;
      if (event.data.type === "AUTOFILL") {
        const updated = [...plan.semesters];
        let moved = false;
        for (const sem of updated) {
          if (moved) break;
          for (const c of sem.courses) {
            if (c.lock === "unlocked") {
              c.lock = "autofilled";
              moved = true;
              break;
            }
          }
        }
        setPlan({ ...plan, semesters: updated });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [plan, setPlan]);

  // Auto-inject Summer semesters after every Spring on plan load.
  useEffect(() => {
    if (!plan) return;
    const existing = new Set(plan.semesters.map((s) => s.index));
    const toAdd: Semester[] = [];
    for (const sem of plan.semesters) {
      if (sem.index[3] === "3") {
        const summerIdx = sem.index.slice(0, 3) + "5";
        if (!existing.has(summerIdx)) {
          existing.add(summerIdx);
          toAdd.push({ index: summerIdx, courses: [] });
        }
      }
    }
    if (toAdd.length > 0) {
      setPlan({
        ...plan,
        semesters: [...plan.semesters, ...toAdd].sort((a, b) =>
          a.index.localeCompare(b.index)
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  if (!plan) {
    return (
      <Box style={{ width: "100vw", height: "100vh" }}>
        <Skeleton height="100%" />
      </Box>
    );
  }

  return (
    <>
      <Box
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--bg-canvas)",
        }}
      >
        <TopBar />
        <PlanHeader />

        <Box
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "minmax(280px, 360px) 1fr",
            gap: 24,
            padding: "0 24px 24px",
          }}
        >
          <Rail />
          <ScheduleColumn />
        </Box>
      </Box>
      <AdvisorChat />
    </>
  );
}

function ScheduleColumn() {
  const { plan, setPlan, cachedCourses } = useContext(PlanContext);
  const { hiddenSemesters } = useContext(DisplaySettingsContext);

  if (!plan) return null;

  const visibleSemesters = [...plan.semesters]
    .filter(
      (sem) => !isSemesterHidden(sem.index, hiddenSemesters) && !!sem.index[3]
    )
    .sort((a, b) => a.index.localeCompare(b.index));

  const removeSemester = (semIndex: string) => {
    const sem = plan.semesters.find((s) => s.index === semIndex);
    if (!sem) return;
    if (sem.courses.length > 0) {
      const label = semesterLabel(semIndex);
      const ok = window.confirm(
        `Remove ${label}? It has ${sem.courses.length} course${
          sem.courses.length === 1 ? "" : "s"
        } that will be deleted.`
      );
      if (!ok) return;
    }
    setPlan({
      ...plan,
      semesters: plan.semesters.filter((s) => s.index !== semIndex),
    });
  };

  const lastIndex =
    visibleSemesters.length > 0
      ? visibleSemesters[visibleSemesters.length - 1].index
      : null;
  const nextIndex = lastIndex
    ? nextSemesterIndex(lastIndex)
    : (() => {
        const yy = new Date().getFullYear() - 2000;
        return `1${yy.toString().padStart(2, "0")}9`;
      })();

  const addNextSemester = () => {
    if (plan.semesters.some((s) => s.index === nextIndex)) return;
    setPlan({
      ...plan,
      semesters: [...plan.semesters, { index: nextIndex, courses: [] }].sort(
        (a, b) => a.index.localeCompare(b.index)
      ),
    });
  };

  return (
    <Box
      style={{
        background: "transparent",
        overflow: "hidden",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollArea
        style={{ flex: 1 }}
        type="scroll"
        scrollbars="y"
        offsetScrollbars
        scrollHideDelay={0}
      >
        <Box className={planDisplayClasses.scheduleGrid}>
          {visibleSemesters.map((sem) => (
            <SemesterCard
              key={sem.index}
              sem={sem}
              onRemove={() => removeSemester(sem.index)}
              creditTotal={sem.courses.reduce(
                (sum, c) => sum + (cachedCourses[c.id]?.cred_min || 0),
                0
              )}
            />
          ))}
          <Box
            className={planDisplayClasses.addTile}
            role="button"
            tabIndex={0}
            onClick={addNextSemester}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                addNextSemester();
              }
            }}
          >
            <Flex align="center" gap={6}>
              <IconPlus size={16} />
              <Text className={planDisplayClasses.addTileTitle}>
                Add semester
              </Text>
            </Flex>
            <Text className={planDisplayClasses.addTileHint}>
              Next: {semesterLabel(nextIndex).replace(/^[^\s]+\s/, "")}
            </Text>
          </Box>
        </Box>
      </ScrollArea>
    </Box>
  );
}

function SemesterCard({
  sem,
  onRemove,
  creditTotal,
}: {
  sem: Semester;
  onRemove: () => void;
  creditTotal: number;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <Box
        className={planDisplayClasses.semesterCard}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <Box className={planDisplayClasses.semesterHeader}>
          <span className={planDisplayClasses.semesterTitle}>
            {semesterLabel(sem.index)}
          </span>
          <span className={planDisplayClasses.semesterCredits}>
            {creditTotal} cr
          </span>
        </Box>

        <Droppable droppableId={String(sem.index)} key={sem.index}>
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={planDisplayClasses.dropZone}
            >
              {(sem.courses as CourseMetadata[]).map((course, j) => (
                <CourseCard
                  key={`${sem.index}-${j}`}
                  courseId={course.id}
                  index={j}
                  semName={sem.index}
                  fontSize="14px"
                  source="plan"
                />
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>

      <Menu
        opened={menu !== null}
        onClose={() => setMenu(null)}
        position="bottom-start"
        withinPortal
        shadow="md"
      >
        <Menu.Target>
          <span
            style={{
              position: "fixed",
              left: menu?.x ?? -9999,
              top: menu?.y ?? -9999,
              width: 1,
              height: 1,
              pointerEvents: "none",
            }}
          />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            color="red"
            onClick={() => {
              setMenu(null);
              onRemove();
            }}
          >
            Remove semester
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
