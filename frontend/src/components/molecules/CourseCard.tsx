"use client";

import { Box, Skeleton } from "@mantine/core";
import { Draggable } from "@hello-pangea/dnd";
import { getCourseColor } from "@/lib/colors";
import { PlannedCourse, CourseStub, CourseDetails } from "@/types/plan";
import { useContext } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { PreviewContext } from "@/contexts/visual/PreviewContext";
import styles from "./CourseCard.module.css";
import { cached } from "sqlite3";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";

const CARD_FIXED_WIDTH = 110;
const CARD_FIXED_HEIGHT = 40;
const CARD_HEIGHT_MULTIPLIER = 20;

const SHINE_STRENGTH = 7;

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

  const backgroundColor = 
    colorKey === "department"
      ? getCourseColor(course, "department")
      : colorKey === "level"
      ? getCourseColor(course, "level")
      : "#607D8B";

  const lockClass = "lock" in course
    ? course.lock === "unlocked"
      ? styles.unlocked
      : course.lock === "autofilled"
      ? styles.autofilled
      : ""
    : "";

  function hexToRgb(hex: string): [number, number, number] | null {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : null;
  }

  function getShinyGradient(backgroundColor: string) {
    const rgb = hexToRgb(backgroundColor);
    // backgroundColor.match(/\d+/g)?.map(Number);
    if (!rgb || rgb.length < 3) return backgroundColor;

    const [r, g, b] = rgb;

    // Convert RGB to HSL
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h *= 60;
    }

    // Generate highlight and shadow using HSL adjustments
    const highlight = `hsl(${h}, ${Math.min(s * 100 + SHINE_STRENGTH, 100)}%, ${Math.min(l * 100 + SHINE_STRENGTH, 100)}%)`;
    const shadow = `hsl(${h}, ${Math.max(s * 100 - SHINE_STRENGTH, 0)}%, ${Math.max(l * 100 - SHINE_STRENGTH, 0)}%)`;
    const base = `hsl(${h}, ${s * 100}%, ${l * 100}%)`;

    return `linear-gradient(135deg, ${shadow} 0%, ${base} 50%, ${highlight} 100%)`;
  }

  const cardElement = (
    <Box
      className={`${styles.card} ${lockClass} ${className}`}
      style={{
        background: getShinyGradient(backgroundColor),
        width: fixedWidth ? `${CARD_FIXED_WIDTH}px` : '100%',
        boxShadow: "0 0 4px 2px rgba(0,0,0,0.2)",
        height: fixedHeight
          ? `${CARD_FIXED_HEIGHT}px`
          : `${("cred_min" in course ? course.cred_min : 1) * CARD_HEIGHT_MULTIPLIER}px`,
        fontSize,
      }}
      onClick={() => {
        if (showPreview) {
          addPersistPreview?.(course, source === "search" ? "right" : "left");
        }
      }}
      onPointerEnter={() => {
        if (showPreview) {
          setTempPreview?.(course, source === "search" ? "bottom-right" : "bottom-left");
        }
      }}
      onPointerLeave={() => {
        if (showPreview) {
          setTempPreview?.(null);
        }
      }}
    >
      {course.dept_abbr} {course.course_num}
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
