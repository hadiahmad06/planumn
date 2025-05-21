import colors from './colors.json';

const levelColors: Record<string, string> = colors.levelColors;
// subjectColors generated with gpt-4o
const subjectColors: Record<string, string> = colors.subjectColors;

export const getCourseColorByDepartment = (course: { subject: string; number: string }) => {
  if (subjectColors[course.subject]) return subjectColors[course.subject];
  return levelColors[course.number[0]] || "#607D8B";
};

export const getCourseColorByLevel = (course: { subject: string; number: string }) => {
  const level = course.number[0];
  return levelColors[level] || "#607D8B";
};
