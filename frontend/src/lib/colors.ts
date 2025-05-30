import colors from './colors.json';
import { ColorKey, CourseDetails } from "@/types/plan"; // Updated import for ColorKey

const levelColors: Record<string, string> = colors.levelColors;
// subjectColors generated with gpt-4o
const subjectColors: Record<string, string> = colors.subjectColors;

export const getCourseColor = (course: CourseDetails, colorKey: ColorKey) => {
  if (colorKey === 'department') {
    return subjectColors[course.dept_abbr] || levelColors[course.course_num[0]] || "#607D8B";
  } else if (colorKey === 'level') {
    return levelColors[course.course_num[0]] || "#607D8B";
  }
  return "#607D8B";
};
