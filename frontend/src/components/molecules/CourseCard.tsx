"use client";

import { Box, Skeleton } from "@mantine/core";
import { Draggable } from "@hello-pangea/dnd";
import { getCourseColor } from "@/lib/colors";
import { PlannedCourse, CourseStub, CourseDetails } from "@/types/plan";
import { useContext, useState } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { PreviewContext } from "@/contexts/visual/PreviewContext";
import styles from "./CourseCard.module.css";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";
import ContextMenu, { MenuItem } from "@/components/atoms/ContextMenu";

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
  source?: "search" | "plan" | "program" | null;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  isCompleted?: boolean;
  isAlternative?: boolean;
  isPlannedAlternative?: boolean;
  showContextMenu?: boolean;
  contextMenuItems?: MenuItem[];
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
  isCompleted = false,
  isAlternative = false,
  isPlannedAlternative = false,
  showContextMenu = true,
  contextMenuItems = [],
}: CourseCardProps) {
  const { cachedCourses, cachedSearchResults } = useContext(PlanContext);
  const { cachedReqCourses } = useContext(PlanAuditContext);
  const { colorKey } = useContext(DisplaySettingsContext);
  const { setTempPreview, addPersistPreview } = useContext(PreviewContext);

  const [contextMenuOpened, setContextMenuOpened] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  const completedClass = isCompleted ? styles.completed : "";
  const alternativeClass = isAlternative ? styles.alternative : "";
  const plannedAlternativeClass = isPlannedAlternative ? styles.plannedAlternative : "";

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
    let h = 0, s = 0;
    const l = (max + min) / 2;

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
      className={`${styles.card} ${lockClass} ${completedClass} ${alternativeClass} ${plannedAlternativeClass} ${className}`}
      style={{
        background: isCompleted
          ? getShinyGradient("#10b981")
          : isAlternative && isPlannedAlternative
          ? getShinyGradient("#3b82f6")
          : isAlternative
          ? getShinyGradient(backgroundColor)
          : getShinyGradient(backgroundColor),
        width: fixedWidth ? `${CARD_FIXED_WIDTH}px` : '100%',
        boxShadow: isCompleted
          ? "0 0 6px 3px rgba(16, 185, 129, 0.4)"
          : isAlternative && isPlannedAlternative
          ? "0 0 6px 3px rgba(59, 130, 246, 0.4)"
          : isAlternative
          ? "0 0 4px 2px rgba(59, 130, 246, 0.3)"
          : "0 0 4px 2px rgba(0,0,0,0.2)",
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
      onContextMenu={(event) => {
        if (showContextMenu && contextMenuItems.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          setContextMenuPosition({ x: event.clientX, y: event.clientY });
          setContextMenuOpened(true);
        }
      }}
    >
      {course.dept_abbr} {course.course_num}
      {showContextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          opened={contextMenuOpened}
          onClose={() => setContextMenuOpened(false)}
          items={contextMenuItems}
          position={contextMenuPosition}
        />
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
