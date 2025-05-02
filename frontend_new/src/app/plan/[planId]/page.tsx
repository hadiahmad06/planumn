"use client";

import { notFound } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
// import { getCourseColor } from "@/lib/colors";
import SettingsPanel from "@/components/SettingsPanel";
import CourseCard from "@/components/CourseCard";
import SearchBar from "@/components/SearchBar";
import CourseCardPreview from "@/components/CourseCardPreview";
import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

// temporary in-memory fake plan data
const mockPlans: Record<string, any> = {
  "abc123": {
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    major: ["Computer Science B.S."],
    semesters: [
      {
        index: "1179", // Fall 2017
        courses: [
          { subject: "WRIT", number: "1301" },
          { subject: "MATH", number: "1271" },
        ],
      },
      {
        index: "1183", // Spring 2018
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1185", // Summer 2018
        courses: [
          { subject: "CSCI", number: "2041" },
          { subject: "MATH", number: "2243" },
        ],
      },
      {
        index: "1199", // Fall 2019
        courses: [
          { subject: "CSCI", number: "4061" },
          { subject: "STAT", number: "3021" },
        ],
      },
      {
        index: "1203", // Spring 2020
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
      {
        index: "1205", // Summer 2020
        courses: [
          { subject: "CSCI", number: "5461" },
        ],
      },
    ],
  },
};

async function getCourseDetails(subject: string, number: string) {
  const response = await fetch(`/api/courses?subject=${subject}&number=${number}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }
  return response.json();
}

export default function PlanPage({ params }: { params: { planId: string } }) {
  const plan = mockPlans[params.planId];

  if (!plan) return notFound();

  const expired = Date.now() - plan.createdAt.getTime() > 1000 * 60 * 60 * 48;
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Plan Expired</h1>
          <p className="text-secondary">This graduation plan is no longer available. Create a new one to get started.</p>
        </div>
      </div>
    );
  }

  const [planState, setPlanState] = useState(plan);
  const [colorByDepartment, setColorByDepartment] = useState(true);
  const [colorByLevel, setColorByLevel] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<{
    subject: string;
    number: string;
    title: string;
    credits: number;
    lock?: string;
  } | null>(null);
  const [courseDetails, setCourseDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchCourseDetails = async () => {
      const details: Record<string, any> = {};
      for (const semester of planState.semesters) {
        for (const course of semester.courses) {
          const key = `${course.subject}-${course.number}`;
          if (!details[key]) {
            try {
              const courseInfo = await getCourseDetails(course.subject, course.number);
              if (courseInfo) {
                details[key] = {
                  ...course,
                  title: courseInfo.title,
                  credits: courseInfo.credits,
                  lock: course.lock || "unlocked"
                };
              }
            } catch (error) {
              console.error(`Error fetching details for ${course.subject} ${course.number}:`, error);
              // Fall back to basic course info if fetch fails
              details[key] = {
                ...course,
                title: `${course.subject} ${course.number}`,
                credits: 0,
                lock: course.lock || "unlocked"
              };
            }
          }
        }
      }
      setCourseDetails(details);
    };

    fetchCourseDetails();
  }, [planState]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const updated = [...planState.semesters];

    const destSem = updated[Number(destination.droppableId)];
    if (!destSem.courses) destSem.courses = [];

    if (source.droppableId === "search") {
      const courseData = JSON.parse(result.draggableId);
      destSem.courses.splice(destination.index, 0, {
        ...courseData,
        lock: "autofilled"
      });
    } else {
      const sourceSem = updated[Number(source.droppableId)];
      const [moved] = sourceSem.courses.splice(source.index, 1);
      destSem.courses.splice(destination.index, 0, moved);
    }

    setPlanState({ ...planState, semesters: updated });
  };

  return (
    <div className="min-h-screen p-8 flex bg-background">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Left Panel - Search and Settings */}
        <div className="w-96 pr-8 flex flex-col gap-6">
          {/* Search Bar */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Search Courses</h2>
            <Droppable droppableId="search">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <SearchBar 
                    colorByDepartment={colorByDepartment}
                    colorByLevel={colorByLevel}
                    onPreviewCourse={setPreviewCourse}
                    currentPlanCourses={planState.semesters.flatMap((sem: { courses: any[] }) => sem.courses)}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Settings Panel */}
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

          {/* Course Preview */}
          {previewCourse && (
            <div className="sticky top-8">
              <CourseCardPreview course={previewCourse} />
            </div>
          )}
        </div>

        {/* Right Panel - Semesters */}
        <div className="flex-1 flex flex-col items-end">
          <div className="w-full max-w-4xl">
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-4 text-foreground">Your Graduation Plan</h1>
              <p className="mb-6 text-secondary">Major: {plan.major.join(", ")}</p>
            </div>

            <div className="flex flex-col gap-8">
              {(() => {
                // Sort all semesters by their index
                const sortedSemesters = [...planState.semesters].sort((a, b) => a.index.localeCompare(b.index));
                
                // Group semesters into rows, starting a new row after Spring (index ending in 3)
                const rows: any[][] = [];
                let currentRow: any[] = [];
                
                sortedSemesters.forEach(sem => {
                  currentRow.push(sem);
                  if (sem.index.endsWith('5')) { // Spring semester
                    rows.push(currentRow);
                    currentRow = [];
                  }
                });
                
                // Add any remaining semesters to the last row
                if (currentRow.length > 0) {
                  rows.push(currentRow);
                }

                return rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-6 justify-end">
                    {row.map((sem) => {
                      const season = sem.index.endsWith('9') ? 'Fall' : 
                                   sem.index.endsWith('3') ? 'Spring' : 'Summer';
                      return (
                        <Droppable droppableId={String(planState.semesters.indexOf(sem))} key={sem.index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="bg-card border border-border rounded-lg shadow-sm p-3 w-[160px] min-h-[160px] flex flex-col items-center"
                            >
                              <p className="text-[18px] font-medium text-foreground mb-1">{season} 20{sem.index.slice(1, 3)}</p>
                              <div className="flex w-full gap-2">
                                <div className="flex flex-col items-end pr-1 text-xs text-secondary">
                                  {[...Array(sem?.courses?.reduce((sum: number, c: any) => {
                                    const key = `${c.subject}-${c.number}`;
                                    return sum + (courseDetails[key]?.credits || 0);
                                  }, 0) || 0)].map((_, i) => (
                                    <div key={i} style={{ height: "20px" }}>{i + 1}</div>
                                  ))}
                                </div>
                                <div className="flex flex-col gap-2 w-full items-center">
                                  {sem?.courses?.map((course: { subject: string; number: string }, j: number) => {
                                    const key = `${course.subject}-${course.number}`;
                                    const fullCourse = courseDetails[key] || course;
                                    return (
                                      <CourseCard
                                        key={`${sem.index}-${j}`}
                                        course={fullCourse}
                                        index={j}
                                        semName={sem.index}
                                        updateLock={() => {
                                          const updated = [...planState.semesters];
                                          const semIdx = updated.findIndex(s => s.index === sem.index);
                                          const courseIdx = updated[semIdx].courses.findIndex((c: { subject: string; number: string }) =>
                                            c.subject === course.subject &&
                                            c.number === course.number
                                          );
                                          const currentLock = updated[semIdx].courses[courseIdx].lock;
                                          updated[semIdx].courses[courseIdx].lock =
                                            currentLock === "locked" ? "unlocked" : "locked";
                                          setPlanState({ ...planState, semesters: updated });
                                        }}
                                        colorByDepartment={colorByDepartment}
                                        colorByLevel={colorByLevel}
                                        fixedWidth={true}
                                      />
                                    );
                                  })}
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
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}