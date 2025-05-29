import colors from './colors.json';
import { ColorKey } from "@/types/plan"; // Updated import for ColorKey

const levelColors: Record<string, string> = colors.levelColors;
// subjectColors generated with gpt-4o
const subjectColors: Record<string, string> = colors.subjectColors;

export const getCourseColor = (course: { subject: string; number: string }, colorKey: ColorKey) => {
  if (colorKey === 'department') {
    return subjectColors[course.subject] || levelColors[course.number[0]] || "#607D8B";
  } else if (colorKey === 'level') {
    return levelColors[course.number[0]] || "#607D8B";
  }
  return "#607D8B";
};
