export const getCourseColor = (course: { subject: string; number: string }) => {
  const subjectColors: Record<string, string> = {
    CSCI: "#7A0019",
    MATH: "#004B87",
    STAT: "#008744",
    WRIT: "#FFB300",
  };
  if (subjectColors[course.subject]) return subjectColors[course.subject];

  const level = course.number[0];
  const levelColors: Record<string, string> = {
    "1": "#9C27B0",
    "2": "#3F51B5",
    "3": "#009688",
    "4": "#FFC107",
    "5": "#FF5722",
  };
  return levelColors[level] || "#607D8B";
};
