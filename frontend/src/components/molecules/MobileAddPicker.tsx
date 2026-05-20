"use client";

import { useContext, useEffect, useState } from "react";
import { Modal, Stack, Text, UnstyledButton, Group } from "@mantine/core";
import { PlanContext } from "@/contexts/data/PlanContext";
import {
  DisplaySettingsContext,
  isSemesterHidden,
} from "@/contexts/visual/DisplaySettingsContext";
import { addCourseToSemester } from "@/lib/addCourseToSemester";
import type { Course } from "@/types/plan";

export const MOBILE_ADD_EVENT = "planumn:mobile-add";

export interface MobileAddRequestDetail {
  course: Course & Partial<{ dept_abbr: string; course_num: string }>;
  /** Optional display label, e.g. "CSCI 2021". Defaults to the course id string. */
  label?: string;
}

function semesterLabel(index: string): string {
  const yy = parseInt(index.slice(1, 3), 10);
  const season = index[3];
  if (season === "9") return `Fall ${2000 + yy}`;
  if (season === "3") return `Spring ${2000 + yy - 1}`;
  if (season === "5") return `Summer ${2000 + yy - 1}`;
  return index;
}

export default function MobileAddPicker() {
  const { plan, setPlan } = useContext(PlanContext);
  const { hiddenSemesters } = useContext(DisplaySettingsContext);
  const [pending, setPending] = useState<MobileAddRequestDetail | null>(null);

  useEffect(() => {
    const onAdd = (e: Event) => {
      const detail = (e as CustomEvent<MobileAddRequestDetail>).detail;
      if (!detail?.course) return;
      setPending(detail);
    };
    window.addEventListener(MOBILE_ADD_EVENT, onAdd);
    return () => window.removeEventListener(MOBILE_ADD_EVENT, onAdd);
  }, []);

  if (!plan) return null;

  const visibleSemesters = [...plan.semesters]
    .filter(
      (sem) => !isSemesterHidden(sem.index, hiddenSemesters) && !!sem.index[3]
    )
    .sort((a, b) => a.index.localeCompare(b.index));

  const close = () => setPending(null);

  const commit = (semIndex: string) => {
    if (!pending) return;
    const next = addCourseToSemester(plan, pending.course, semIndex);
    setPlan(next);
    close();
  };

  const titleLabel =
    pending?.label ?? (pending?.course ? `Course ${pending.course.id}` : "course");

  return (
    <Modal
      opened={pending !== null}
      onClose={close}
      centered
      size="sm"
      title={
        <Text
          style={{
            fontSize: "var(--font-size-label)",
            fontWeight: 600,
            color: "var(--accent-primary)",
          }}
        >
          Add {titleLabel}
        </Text>
      }
      radius="var(--radius-lg)"
      overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      styles={{
        content: {
          backgroundColor: "var(--bg-surface)",
          boxShadow: "var(--shadow-overlay)",
          border: "1px solid var(--border-subtle)",
        },
        header: {
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        },
        body: { padding: "var(--space-1)" },
      }}
    >
      <Stack gap={4}>
        {visibleSemesters.length === 0 && (
          <Text
            ta="center"
            p="md"
            style={{ color: "var(--text-tertiary)", fontSize: "var(--font-size-body)" }}
          >
            No semesters available. Add one first.
          </Text>
        )}
        {visibleSemesters.map((sem) => (
          <UnstyledButton
            key={sem.index}
            onClick={() => commit(sem.index)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          >
            <Group justify="space-between">
              <Text style={{ fontSize: "var(--font-size-body)", fontWeight: 500 }}>
                {semesterLabel(sem.index)}
              </Text>
              <Text style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)" }}>
                {sem.courses.length} course{sem.courses.length === 1 ? "" : "s"}
              </Text>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Modal>
  );
}

export function requestMobileAdd(detail: MobileAddRequestDetail) {
  window.dispatchEvent(new CustomEvent(MOBILE_ADD_EVENT, { detail }));
}
