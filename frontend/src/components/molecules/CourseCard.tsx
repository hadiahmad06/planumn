"use client";

import { Box, Skeleton } from "@mantine/core";
import { Draggable } from "@hello-pangea/dnd";
import { getCourseStripeColor } from "@/lib/colors";
import { PlannedCourse, CourseStub, CourseDetails } from "@/types/plan";
import { useContext } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { PreviewContext } from "@/contexts/visual/PreviewContext";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";
import styles from "./CourseCard.module.css";

const CARD_FIXED_WIDTH = 110;
const CARD_FIXED_HEIGHT = 40;

interface CourseCardProps {
  courseId: number | string;
  index?: number;
  semName?: string;
  showPreview?: boolean;
  isDraggable?: boolean;
  className?: string;
  fontSize?: string;
  source?: "search" | "plan" | null;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
}

export default function CourseCard({
  courseId,
  index = 0,
  semName = "",
  showPreview = true,
  isDraggable = true,
  className = "",
  fontSize = "14px",
  source = "search",
  fixedWidth = false,
  fixedHeight = false,
}: CourseCardProps) {
  const { cachedCourses, cachedSearchResults } = useContext(PlanContext);
  const { cachedReqCourses } = useContext(PlanAuditContext);
  const { colorKey } = useContext(DisplaySettingsContext);
  const { setTempPreview, addPersistPreview } = useContext(PreviewContext);

  const course: CourseDetails | PlannedCourse | CourseStub =
    typeof courseId === "string"
      ? cachedReqCourses[courseId]
      : cachedCourses[courseId] || cachedSearchResults[courseId];

  if (!course) {
    return <Skeleton width={CARD_FIXED_WIDTH} height={CARD_FIXED_HEIGHT} />;
  }

  const stripeColor = getCourseStripeColor(course, colorKey);
  const creditValue = "cred_min" in course ? course.cred_min : null;

  const cardElement = (
    <Box
      className={`${styles.card} ${className}`}
      style={{
        ["--card-accent" as any]: stripeColor,
        width: fixedWidth ? `${CARD_FIXED_WIDTH}px` : "100%",
        height: fixedHeight
          ? `${CARD_FIXED_HEIGHT}px`
          : `calc(${creditValue ?? 1} * var(--card-credit-row-height))`,
        fontSize,
      }}
      onClick={() => {
        if (showPreview) {
          addPersistPreview?.(course, source === "search" ? "right" : "left");
        }
      }}
      onPointerEnter={() => {
        if (showPreview) {
          setTempPreview?.(
            course,
            source === "search" ? "bottom-right" : "bottom-left"
          );
        }
      }}
      onPointerLeave={() => {
        if (showPreview) {
          setTempPreview?.(null);
        }
      }}
    >
      <span className={styles.cardLabel}>
        {course.dept_abbr} {course.course_num}
      </span>
      {creditValue != null && (
        <span className={styles.cardCredit}>{creditValue} cr</span>
      )}
    </Box>
  );

  if (!isDraggable) {
    return cardElement;
  }

  return (
    <Draggable draggableId={`${semName}-${index}`} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
        >
          {cardElement}
        </Box>
      )}
    </Draggable>
  );
}
