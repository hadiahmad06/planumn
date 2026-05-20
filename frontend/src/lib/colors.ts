import colors from './colors.json';
import { ColorKey, CourseStub } from "@/types/plan";

const levelColors: Record<string, string> = colors.levelColors;
// subjectColors generated with gpt-4o
const subjectColors: Record<string, string> = colors.subjectColors;

// Four-bucket department stripe palette per ADR-0004.
// Maps `dept_abbr` → CSS token var. Anything outside falls through to neutral.
const departmentStripeBuckets: Record<string, string> = {
  CSCI: "var(--stripe-cs-math)",
  MATH: "var(--stripe-cs-math)",
  MUS: "var(--stripe-humanities)",
  HSEM: "var(--stripe-humanities)",
  PHYS: "var(--stripe-sciences)",
  CHEM: "var(--stripe-sciences)",
  BIOL: "var(--stripe-sciences)",
  PSY: "var(--stripe-sciences)",
};

export const getCourseColor = (course: CourseStub, colorKey: ColorKey) => {
  if (colorKey === 'department') {
    return subjectColors[course.dept_abbr] || levelColors[course.course_num[0]] || "var(--stripe-neutral)";
  } else if (colorKey === 'level') {
    return levelColors[course.course_num[0]] || "var(--stripe-neutral)";
  }
  return "var(--stripe-neutral)";
};

// Schedule-card 4px stripe color. Honors the user's ColorKey setting but
// resolves through the four-bucket palette per ADR-0004 / Slice 3.
export const getCourseStripeColor = (
  course: CourseStub,
  colorKey: ColorKey
): string => {
  if (colorKey === 'none') return "var(--stripe-neutral)";
  if (colorKey === 'level') {
    return levelColors[course.course_num[0]] || "var(--stripe-neutral)";
  }
  // department (default)
  return (
    departmentStripeBuckets[course.dept_abbr] ||
    "var(--stripe-neutral)"
  );
};
