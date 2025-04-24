"use client";

import { notFound } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState } from "react";
import { getCourseColor } from "@/lib/colors";
import SettingsPanel from "@/components/SettingsPanel";
import CourseCard from "@/components/CourseCard";
import SearchBar from "@/components/SearchBar";

// temporary in-memory fake plan data
const mockPlans: Record<string, any> = {
  "abc123": {
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    major: ["Computer Science B.S."],
    semesters: [
      {
        name: "Fall 2024",
        courses: [
          { subject: "WRIT", number: "1301", title: "University Writing", credits: 4, lock: "locked" },
          { subject: "MATH", number: "1271", title: "Calculus I", credits: 4, lock: "unlocked" },
        ],
      },
      {
        name: "Spring 2025",
        courses: [
          { subject: "CSCI", number: "1133", title: "Intro to Programming", credits: 4, lock: "locked" },
          { subject: "MATH", number: "1272", title: "Calculus II", credits: 4, lock: "unlocked" },
        ],
      },
      {
        name: "Fall 2025",
        courses: [
          { subject: "CSCI", number: "2041", title: "Advanced Programming Principles", credits: 4, lock: "locked" },
          { subject: "MATH", number: "2243", title: "Linear Algebra & Differential Equations", credits: 4, lock: "unlocked" },
        ],
      },
      {
        name: "Spring 2026",
        courses: [
          { subject: "CSCI", number: "4061", title: "Intro to Operating Systems", credits: 4, lock: "locked" },
          { subject: "STAT", number: "3021", title: "Intro to Probability & Statistics", credits: 3, lock: "unlocked" },
        ],
      },
      {
        name: "Fall 2026",
        courses: [
          { subject: "CSCI", number: "4041", title: "Algorithms & Data Structures", credits: 4, lock: "locked" },
        ],
      },
      {
        name: "Spring 2027",
        courses: [
          { subject: "CSCI", number: "5461", title: "Intro to AI", credits: 3, lock: "unlocked" },
        ],
      },
    ],
  },
};

export default function PlanPage({ params }: { params: { planId: string } }) {
  const plan = mockPlans[params.planId];

  if (!plan) return notFound();

  const expired = Date.now() - plan.createdAt.getTime() > 1000 * 60 * 60 * 48;
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Plan Expired</h1>
          <p className="text-gray-600">This graduation plan is no longer available. Create a new one to get started.</p>
        </div>
      </div>
    );
  }

  const [searchQuery, setSearchQuery] = useState("");
  const searchCourses = [
    { subject: "CSCI", number: "3081", title: "Software Engineering", credits: 4 },
    { subject: "CSCI", number: "2021", title: "Machine Architecture", credits: 4 },
    { subject: "CSCI", number: "4707", title: "Database Systems", credits: 3 },
    { subject: "CSCI", number: "5271", title: "Advanced OS", credits: 3 },
  ];

  const [planState, setPlanState] = useState(plan);
  const [colorByDepartment, setColorByDepartment] = useState(true);
  const [colorByLevel, setColorByLevel] = useState(true);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const updated = [...planState.semesters];

    const destSem = updated[Number(destination.droppableId)];
    if (!destSem.courses) destSem.courses = [];

    if (source.droppableId === "search") {
      const newCourse = { ...searchCourses[source.index], lock: "autofilled" };
      destSem.courses.splice(destination.index, 0, newCourse);
    } else {
      const sourceSem = updated[Number(source.droppableId)];
      const [moved] = sourceSem.courses.splice(source.index, 1);
      destSem.courses.splice(destination.index, 0, moved);
    }

    setPlanState({ ...planState, semesters: updated });
  };

  return (
    <div className="min-h-screen p-8 flex">
      <div className="flex-1 pr-4">
        <h1 className="text-3xl font-bold mb-4">Your Graduation Plan</h1>
        <p className="mb-6 text-gray-700">Major: {plan.major.join(", ")}</p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <SearchBar />
          <div className="flex flex-col gap-8">
            {(() => {
              const grouped: Record<string, any[]> = {};
              for (const sem of planState.semesters) {
                const year = sem.name.split(" ")[1];
                if (!grouped[year]) grouped[year] = [];
                grouped[year].push(sem);
              }
              return Object.entries(grouped).map(([year, sems], idx) => (
                <div key={idx} className="flex gap-6 justify-start">
                  {["Fall", "Spring", "Summer"].map((season) => {
                    const semIndex = planState.semesters.findIndex(
                      (s) => s.name === `${season} ${year}`
                    );
                    let sem = planState.semesters[semIndex];
                    if (semIndex === -1) {
                      sem = { name: `${season} ${year}`, courses: [] };
                      planState.semesters.push(sem);
                    }
                    return (
                      <Droppable droppableId={String(semIndex === -1 ? planState.semesters.length - 1 : semIndex)} key={season}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md p-4 w-[160px] min-h-[160px] flex flex-col items-center"
                          >
                            <h2 className="text-sm font-semibold mb-2">{season} {year}</h2>
                            <div className="flex w-full gap-2">
                              <div className="flex flex-col items-end pr-1 text-xs text-gray-500">
                                {[...Array(sem?.courses?.reduce((sum: number, c: any) => sum + c.credits, 0) || 0)].map((_, i) => (
                                  <div key={i} style={{ height: "20px" }}>{i + 1}</div>
                                ))}
                              </div>
                              <div className="flex flex-col gap-2 w-full items-center">
                                {sem?.courses?.map((course: any, j: number) => (
                                  <CourseCard
                                    key={`${sem.name}-${j}`}
                                    course={course}
                                    index={j}
                                    semName={sem.name}
                                    updateLock={() => {
                                      const updated = [...planState.semesters];
                                      const semIdx = updated.findIndex(s => s.name === sem.name);
                                      const courseIdx = updated[semIdx].courses.findIndex(c => c === course);
                                      const currentLock = updated[semIdx].courses[courseIdx].lock;
                                      updated[semIdx].courses[courseIdx].lock =
                                        currentLock === "locked" ? "unlocked" : "locked";
                                      setPlanState({ ...planState, semesters: updated });
                                    }}
                                    colorByDepartment={colorByDepartment}
                                    colorByLevel={colorByLevel}
                                  />
                                ))}
                                {provided.placeholder}
                              </div>
                            </div>
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </DragDropContext>
      </div>
      <SettingsPanel
        colorByDepartment={colorByDepartment}
        colorByLevel={colorByLevel}
        setColorByDepartment={setColorByDepartment}
        setColorByLevel={setColorByLevel}
        onAutofill={() => {
          const updated = [...planState.semesters];
          let moved = false;
          for (const sem of updated) {
            if (moved) break;
            for (const c of sem.courses) {
              if (c.lock === "unlocked") {
                c.lock = "autofilled";
                moved = true;
                break;
              }
            }
          }
          setPlanState({ ...planState, semesters: updated });
        }}
      />
    </div>
  );
}