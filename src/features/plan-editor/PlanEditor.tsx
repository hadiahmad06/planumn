"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import type { CourseId } from "@/domain/course";
import { findSemester } from "@/domain/planOps";
import type { Plan } from "@/domain/plan";
import { plannedCourseIds } from "@/domain/plan";
import { useCourseInfo, useCourses } from "@/features/catalog/courseCache";
import { PreviewLayer } from "@/features/preview/PreviewLayer";
import { MobileRailSection } from "@/features/requirements/MobileRailSection";
import { RequirementsRail } from "@/features/requirements/RequirementsRail";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CourseCardFace } from "./CourseCard";
import { resolveDrop, type DragData, type DropData } from "./dnd";
import { PlanHeader } from "./PlanHeader";
import { Schedule } from "./Schedule";
import { planActions, usePlanStore } from "./store";
import { TopBar } from "./TopBar";

// Prefer the droppable under the pointer; fall back to overlap (keyboard drags have no pointer).
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

function DragPreview({ id }: { id: CourseId }) {
  const course = useCourseInfo(id);
  return (
    <div className="w-52 cursor-grabbing">
      <CourseCardFace course={course} dragging />
    </div>
  );
}

/**
 * The whole plan view: top bar, requirements rail, schedule. Owned by Hadi's Claude.
 * Route pages (owned by Michael's Codex) load a plan and render `<PlanEditor initialPlan={plan} />`.
 */
export function PlanEditor({ initialPlan }: { initialPlan: Plan }) {
  const loadPlan = usePlanStore((s) => s.loadPlan);
  const plan = usePlanStore((s) => s.plan);
  const [dragging, setDragging] = useState<CourseId | null>(null);
  const mobile = useIsMobile();
  useEffect(() => loadPlan(initialPlan), [initialPlan, loadPlan]);
  useCourses(plan ? plannedCourseIds(plan) : []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => setDragging((e.active.data.current as DragData | undefined)?.courseId ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const current = usePlanStore.getState().plan;
    if (!current) return;
    const action = resolveDrop(
      e.active.data.current as DragData | undefined,
      e.over?.data.current as DropData | undefined,
      (term) => findSemester(current, term)?.courses.length ?? 0,
    );
    if (action?.kind === "move") planActions.moveCourse(action.from, action.to);
    if (action?.kind === "add") planActions.addCourse(action.term, action.courseId, action.index);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="flex h-dvh flex-col">
        <TopBar />
        {plan && (
          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
            {!mobile && (
              <aside className="min-h-0 overflow-y-auto border-r border-border p-4">
                <RequirementsRail plan={plan} />
              </aside>
            )}
            <main className="min-h-0 overflow-y-auto p-4 md:p-6">
              <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <PlanHeader plan={plan} />
                {mobile && <MobileRailSection plan={plan} />}
                <Schedule plan={plan} />
              </div>
            </main>
          </div>
        )}
      </div>
      <DragOverlay dropAnimation={null}>{dragging != null && <DragPreview id={dragging} />}</DragOverlay>
      <PreviewLayer />
    </DndContext>
  );
}
