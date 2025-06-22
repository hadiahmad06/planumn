import { Distribution } from "@/types/plan";
import { useState } from "react";


export const GPA_MAP = {
    "A+": 4.333,
    A: 4,
    "A-": 3.667,
    "B+": 3.333,
    B: 3,
    "B-": 2.667,
    "C+": 2.333,
    C: 2,
    "C-": 1.667,
    "D+": 1.333,
    D: 1,
    "D-": 0.667,
    F: 0,
  };
  
const GRADE_ORDER = [
    "F",
    "D-",
    "D",
    "D+",
    "C-",
    "C",
    "C+",
    "B-",
    "B",
    "B+",
    "A-",
    "A",
    "A+",
  ];

export const letterToGpa = (letter: string) => {
  if (letter === undefined || !GPA_MAP[letter as keyof typeof GPA_MAP]) return 0;
  return GPA_MAP[letter as keyof typeof GPA_MAP];
};

export const AreaChart = ({ distribution, isMobile = true }: { distribution: Distribution, isMobile: boolean }) => {
    const { isSummary, grades } = distribution;
    // Check if there are no letter grades (A, B, C, D, F) in the grades object
    const letterGradeKeys = ['A', 'B', 'C', 'D', 'F'];
    const noLetterGrades = !grades || !letterGradeKeys.some(grade => grades[grade] > 0);
    if (noLetterGrades) {
      return (
        <div style={{
          width: 'fit-content',
          margin: '0 auto',
          textAlign: 'center',
          color: '#888',
          fontStyle: 'italic',
          padding: '16px 0'
        }}>
          Grades are not available.
        </div>
      );
    }

    const totalWeightedGPA = Object.entries(grades ?? {}).reduce((sum, [letter, count]) => {
      return sum + (letterToGpa(letter) * count);
    }, 0);

    const totalStudents = Object.values(grades ?? {}).reduce((sum, count) => sum + count, 0);

    const averageGPA = totalStudents > 0 ? totalWeightedGPA / totalStudents : 0;
  
    let scale = isSummary ? 1.3 : 1;
    if (isMobile) scale = 0.8;
  
    const BOTTOM_MARGIN = 10;
    const AREA_GRAPH_HEIGHT = 50 * scale - BOTTOM_MARGIN;
    const AREA_GRAPH_WIDTH = 300 * scale;
  
    const [hovered, setHovered] = useState(false);
    const [hoveredGrade, setHoveredGrade] = useState<{
      grade: string;
      gradeCount: number;
      gpa: number;
    } | null>(null);
  
    const hasAPlus = grades?.["A+"] > 0;
  
    const maxGrade = Math.max(...Object.values(grades ?? {}));
  
    const letterGrades = GRADE_ORDER.filter(
      (grade) => hasAPlus || grade !== "A+"
    );
  
    const points = `0,${AREA_GRAPH_HEIGHT} ${letterGrades
      .map(
        (grade, index, arr) =>
          `${(AREA_GRAPH_WIDTH * index) / (arr.length - 1)},${
            AREA_GRAPH_HEIGHT * (1 - (grades?.[grade] ?? 0) / maxGrade)
          }`
      )
      .join(" ")} ${AREA_GRAPH_WIDTH},${AREA_GRAPH_HEIGHT}`;
  
    // add text labels above every major grade (A, B, C, D, F)
  
    const labelPoints = letterGrades
      .map((grade, index, arr) => [
        (AREA_GRAPH_WIDTH * index) / (arr.length - 1),
        // AREA_GRAPH_HEIGHT * (1 - (grades?.[grade] ?? 0) / maxGrade),
        AREA_GRAPH_HEIGHT + BOTTOM_MARGIN,
        grade,
      ])
      .filter(([, , grade]) => !String(grade).includes("+") && !String(grade).includes("-"));
  
    const maxGPA = hasAPlus ? 4.333 : 4;
  
    // get mouse coordinates relative to the graph
    const getMouseCoords = (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { x, y };
    };
  
    const numGrades = GRADE_ORDER.length - (hasAPlus ? 0 : 1);
  
  
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const { x, y } = getMouseCoords(e);
  
      // get the grade that the mouse is over
      const grade = GRADE_ORDER[Math.floor((x / AREA_GRAPH_WIDTH) * numGrades)];
  
      // get the number of students that got that grade
      const gradeCount = grades?.[grade] ?? 0;
  
      // get the GPA that the mouse is over
      const gpa = letterToGpa(grade);
  
      // if the mouse is over the graph, show the tooltip
      if (x > 0 && x < AREA_GRAPH_WIDTH && y > 0 && y < AREA_GRAPH_HEIGHT) {
        setHovered(true);
        setHoveredGrade({
          grade,
          gradeCount,
          gpa,
        });
        // setHovered(false);
      }
    };
    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => setHovered(false);
  
    const hoverCoordinates =
      hovered && hoveredGrade
        ? {
            closestGrade: {
              y:
                AREA_GRAPH_HEIGHT *
                (1 - (hoveredGrade.gradeCount ?? 0) / maxGrade),
              x:
                (AREA_GRAPH_WIDTH * GRADE_ORDER.indexOf(hoveredGrade.grade)) /
                (numGrades - 1),
            },
          }
        : {};
  
    return (
      <svg
        height={AREA_GRAPH_HEIGHT + BOTTOM_MARGIN}
        width={AREA_GRAPH_WIDTH}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <defs>
          <linearGradient
            id={"trafficLight"}
            x1={"0"}
            y1={"0.5"}
            x2={"1"}
            y2={"0.5"}
          >
            <stop offset={"0%"} stopColor={"#ff0000"} />
            <stop offset={"40.5%"} stopColor={"#ec6c17"} />
            <stop offset={"50%"} stopColor={"#e89029"} />
            <stop offset={"65%"} stopColor={"#ecc94b"} />
            <stop offset={"80%"} stopColor={"#ecc94b"} />
            <stop offset={"85%"} stopColor={"#c0c246"} />
            <stop offset={"90%"} stopColor={"#93ba41"} />
            <stop offset={"95%"} stopColor={"#38a169"} />
            <stop offset={"100%"} stopColor={"#38a169"} />
          </linearGradient>
        </defs>
        <line
          x1={(AREA_GRAPH_WIDTH * averageGPA) / maxGPA}
          y1={0}
          x2={(AREA_GRAPH_WIDTH * averageGPA) / maxGPA}
          y2={AREA_GRAPH_HEIGHT}
          style={{
            stroke: "rgba(0, 0, 0, 0.25)",
            strokeWidth: 1,
          }}
        />
        <polygon
          points={points}
          style={{
            opacity: 0.7,
            fill: 'url("#trafficLight")',
          }}
        />
        {labelPoints.map(([x, y, grade]) => (
          <text
            key={`label-${grade}`}
            x={Math.max(3, Math.min(AREA_GRAPH_WIDTH - 5, x as number))}
            // if the text is off the top of the graph, move it down
            y={Math.max(y as number, 10)}
            style={{
              textAnchor: "middle",
              fontSize: 9,
              userSelect: "none",
              fontWeight: "bold",
              fill: "rgba(128, 128, 128, 0.5)",
            }}
          >
            {grade}
          </text>
        ))}
        {hovered && hoveredGrade && (
          <g>
            <line
              x1={0}
              y1={hoverCoordinates.closestGrade?.y ?? 0}
              x2={AREA_GRAPH_WIDTH}
              y2={hoverCoordinates.closestGrade?.y ?? 0}
              style={{
                stroke: "rgba(0, 0, 0, 0.025)",
                strokeWidth: 4,
              }}
            />
            <line
              x1={hoverCoordinates.closestGrade?.x ?? 0}
              y1={0}
              x2={hoverCoordinates.closestGrade?.x ?? 0}
              y2={AREA_GRAPH_HEIGHT + BOTTOM_MARGIN}
              style={{
                stroke: "rgba(0, 0, 0, 0.1)",
                strokeWidth: 4,
              }}
            />
            <circle
              cx={hoverCoordinates.closestGrade?.x ?? 0}
              cy={hoverCoordinates.closestGrade?.y ?? 0}
              r={3}
              style={{
                fill: "rgba(0, 0, 0, 0.5)",
              }}
            />
            <text
              x={AREA_GRAPH_WIDTH / 2}
              y={AREA_GRAPH_HEIGHT / 4}
              style={{
                textAnchor: "middle",
                dominantBaseline: "middle",
                fontSize: 12,
                userSelect: "none",
                fontWeight: "bold",
                fill: "#1B202B",
              }}
            >
              {hoveredGrade.gradeCount} student
              {hoveredGrade.gradeCount > 1 && "s"} got a
              {hoveredGrade.grade?.startsWith("A") ||
              hoveredGrade.grade?.startsWith("F")
                ? "n"
                : ""}{" "}
              {hoveredGrade.grade} (
              {Math.round((hoveredGrade.gradeCount * 100) / totalStudents)}%)
            </text>
          </g>
        )}
      </svg>
    );
  };