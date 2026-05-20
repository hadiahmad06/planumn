"use client";

import { CourseDetails } from "@/types/plan";
import {
  Stack,
  Text,
  Box,
  Group,
  CloseButton,
  Collapse,
  Badge,
  Button,
  Skeleton,
} from "@mantine/core";
import { useContext, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconLock, IconLockOpen } from "@tabler/icons-react";
import { BarChart } from "../atoms/course-preview/barchart";
import { AreaChart } from "../atoms/course-preview/areachart";
import {
  CoursePreview,
  HydratedPreview,
  PreviewContext,
  PreviewPosition,
} from "@/contexts/visual/PreviewContext";
import { PlanContext } from "@/contexts/data/PlanContext";
import { LockType, Semester } from "@/types/plan";

export function getXYFromCoords(coords: {
  top?: number | string;
  left?: number | string;
  bottom?: number | string;
  right?: number | string;
  transform?: string;
}): { x: number; y: number } {
  let x = 0;
  let y = 0;
  if (typeof coords.left === "number") x = coords.left;
  else if (typeof coords.right === "number")
    x = window.innerWidth * 0.75 - coords.right;
  if (typeof coords.top === "number") y = coords.top;
  else if (typeof coords.bottom === "number")
    y = window.innerHeight - coords.bottom;
  if (coords.transform?.includes("translateY(-50%)"))
    y += window.innerHeight * 0.5;
  if (coords.transform?.includes("translateX(-50%)"))
    x -= window.innerWidth * 0.5;
  return { x, y };
}

export const mapPositionToCoords = (pos: PreviewPosition | null) => {
  const DEFAULT_MARGIN = 20;
  switch (pos) {
    case "top-left":
      return { top: DEFAULT_MARGIN, left: DEFAULT_MARGIN };
    case "top-right":
      return { top: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
    case "bottom-left":
      return { bottom: DEFAULT_MARGIN, left: DEFAULT_MARGIN };
    case "bottom-right":
      return { bottom: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
    case "top":
      return { top: DEFAULT_MARGIN, left: "50%", transform: "translateX(-50%)" };
    case "bottom":
      return {
        bottom: DEFAULT_MARGIN,
        left: "50%",
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        left: DEFAULT_MARGIN,
        top: "50%",
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        right: DEFAULT_MARGIN,
        top: "50%",
        transform: "translateY(-50%)",
      };
    default:
      return { bottom: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
  }
};

function getPreviewStyle(
  pos: PreviewPosition,
  temp: boolean
): React.CSSProperties {
  const coords = mapPositionToCoords(pos);
  return {
    position: "fixed",
    ...(temp ? coords : {}),
    width: temp ? "47.5%" : "25%",
    backgroundColor: "var(--bg-surface)",
    padding: 20,
    borderRadius: "var(--radius-lg)",
    pointerEvents: "auto",
    boxShadow: temp ? "var(--shadow-card)" : "var(--shadow-overlay)",
    border: temp
      ? "1px solid var(--border-subtle)"
      : "1px solid var(--accent-primary)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    zIndex: 1000,
  };
}

function GradeChartsRow({
  course,
  temp,
}: {
  course: CourseDetails;
  temp: boolean;
}) {
  return (
    <Group
      justify="flex-end"
      style={{
        display: "flex",
        flexWrap: "nowrap",
        width: temp ? "80%" : "100%",
        height: temp ? 70 : 50,
        gap: 16,
        alignItems: "stretch",
      }}
    >
      <Box style={{ height: "100%", display: "flex", alignItems: "center" }}>
        <BarChart
          distribution={{
            grades:
              typeof course.total_grades === "string"
                ? JSON.parse(course.total_grades)
                : course.total_grades,
            isSummary: false,
          }}
          isMobile={false}
        />
      </Box>
      <Box style={{ height: "100%", display: "flex", alignItems: "center" }}>
        <AreaChart
          distribution={{
            grades:
              typeof course.total_grades === "string"
                ? JSON.parse(course.total_grades)
                : course.total_grades,
            isSummary: false,
          }}
          isMobile={false}
        />
      </Box>
    </Group>
  );
}

/** Locate which (semester, index) holds this course in the plan, if any. */
function findPlannedLocation(
  semesters: Semester[] | undefined,
  courseId: number
): { semIndex: string; idx: number; lock: LockType } | null {
  if (!semesters) return null;
  for (const sem of semesters) {
    const idx = sem.courses.findIndex((c) => c.id === courseId);
    if (idx >= 0) {
      return { semIndex: sem.index, idx, lock: sem.courses[idx].lock };
    }
  }
  return null;
}

function LockControls({ course }: { course: CourseDetails }) {
  const { plan, setPlan } = useContext(PlanContext);
  const loc = findPlannedLocation(plan?.semesters, course.id);
  if (!plan || !loc) return null;

  const { lock } = loc;
  const toggle = () => {
    const nextLock: LockType = lock === "locked" ? "unlocked" : "locked";
    const semesters = plan.semesters.map((s) => {
      if (s.index !== loc.semIndex) return s;
      const courses = s.courses.map((c, i) =>
        i === loc.idx ? { ...c, lock: nextLock } : c
      );
      return { ...s, courses };
    });
    setPlan({ ...plan, semesters });
  };

  return (
    <Group gap="xs" align="center">
      {lock === "locked" && (
        <Badge variant="filled" color="dark" radius="sm" size="sm">
          Locked
        </Badge>
      )}
      {lock === "autofilled" && (
        <Badge variant="light" color="gray" radius="sm" size="sm">
          Autofilled
        </Badge>
      )}
      <Button
        size="xs"
        variant="default"
        radius="md"
        leftSection={
          lock === "locked" ? (
            <IconLockOpen size={14} />
          ) : (
            <IconLock size={14} />
          )
        }
        onClick={toggle}
      >
        {lock === "locked" ? "Unlock" : "Lock"}
      </Button>
    </Group>
  );
}

type CoursePreviewEntryProps = {
  entry: HydratedPreview;
  temp: boolean;
};

export function CoursePreviewEntry({ entry, temp }: CoursePreviewEntryProps) {
  const { removePersistPreview } = useContext(PreviewContext);
  const { course, pos } = entry;
  const commonStyle = getPreviewStyle(pos, temp);
  const [descHover, setDescHover] = useState(false);
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Box
      key={`preview-${temp ? "temp-" : "persist-"}${course.id}`}
      className="drag-handle"
      style={commonStyle}
      onPointerOver={() => setDescHover(true)}
      onPointerLeave={() => setDescHover(false)}
    >
      <Stack gap="sm" style={{ alignItems: "flex-start" }}>
        <Group
          justify="space-between"
          align="center"
          style={{ width: "100%", flexWrap: "nowrap" }}
        >
          <Stack
            gap={4}
            style={{ minWidth: "40%", width: temp ? undefined : "100%" }}
          >
            <Group justify="space-between" style={{ width: "100%" }}>
              <Group gap={6} align="baseline">
                <Text
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    color: "var(--accent-primary)",
                  }}
                >
                  {course.dept_abbr} {course.course_num}
                </Text>
                {!temp && (
                  <Text
                    style={{
                      fontSize: "var(--font-size-label)",
                      fontWeight: 600,
                      color: "var(--accent-primary)",
                    }}
                  >
                    ·{" "}
                    {course.cred_min === course.cred_max
                      ? course.cred_min
                      : `${course.cred_min}-${course.cred_max}`}{" "}
                    cr
                  </Text>
                )}
              </Group>
              {!temp && (
                <CloseButton
                  onClick={() => removePersistPreview(course.id)}
                  size="lg"
                />
              )}
            </Group>
            <Text
              style={{
                fontSize: "var(--font-size-label)",
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {course.class_desc}
            </Text>
            {!temp && <LockControls course={course} />}
          </Stack>
          {temp && <GradeChartsRow course={course} temp={temp} />}
        </Group>

        {temp && (
          <Box
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "var(--border-subtle)",
            }}
          />
        )}

        <Group
          justify="space-between"
          style={{ width: "100%", flexWrap: "wrap" }}
        >
          {!temp && <GradeChartsRow course={course} temp={temp} />}
          <Box style={{ width: "100%" }}>
            <Group
              justify="flex-start"
              onClick={temp ? undefined : toggle}
              style={{ alignItems: "center", cursor: "pointer" }}
            >
              <Text
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                }}
              >
                Description
              </Text>
              {!temp && (
                <>
                  <IconChevronDown
                    size={16}
                    style={{
                      transform: opened ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 300,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    click to keep open
                  </Text>
                </>
              )}
            </Group>
            <Collapse
              in={temp || opened || descHover}
              transitionDuration={300}
              transitionTimingFunction="ease"
            >
              <Text
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                {course.onestop_desc}
              </Text>
            </Collapse>
          </Box>
        </Group>
      </Stack>
    </Box>
  );
}

type CoursePreviewSkeletonProps = {
  entry: CoursePreview;
  temp: boolean;
};

export function CoursePreviewSkeleton({
  entry,
  temp,
}: CoursePreviewSkeletonProps) {
  const { course, pos } = entry;
  const commonStyle = getPreviewStyle(pos, temp);
  return (
    <Box
      key={`skeleton-${temp ? "temp-" : "persist-"}${course.id}`}
      className="drag-handle"
      style={commonStyle}
    >
      <Stack gap="md">
        <Skeleton height={28} width="40%" radius="sm" />
        <Skeleton height={20} width="60%" radius="sm" />
        <Box
          style={{
            width: "100%",
            height: 1,
            backgroundColor: "var(--border-subtle)",
          }}
        />
        <Stack gap="xs">
          <Skeleton height={16} width="25%" radius="sm" />
          <Skeleton height={16} width="30%" radius="sm" />
        </Stack>
        <Skeleton height={16} width="90%" radius="sm" />
        <Skeleton height={16} width="85%" radius="sm" />
        <Skeleton height={16} width="75%" radius="sm" />
      </Stack>
    </Box>
  );
}
