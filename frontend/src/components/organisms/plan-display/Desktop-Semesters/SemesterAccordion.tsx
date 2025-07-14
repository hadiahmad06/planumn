import { Droppable } from "@hello-pangea/dnd";
import { Accordion, Box, Flex, Text } from "@mantine/core";
import { Semester } from "@/types/plan";
import CourseCard from "@/components/molecules/CourseCard";
import {useContext} from "react";
import {PlanContext} from "@/contexts/data/PlanContext";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";

const SEMESTER_BOX_WIDTH = "160px";
const SEMESTER_BOX_MIN_HEIGHT = "90px";
const CREDIT_LINE_HEIGHT = "20px";
const SEMESTER_BACKGROUND = 'linear-gradient(135deg, rgba(221, 208, 208, 0.8), rgba(245, 245, 255, 0.6))';
const COURSE_VERTICAL_GAP = 0;

type Props = {
    sem: Semester;
    season: "🍂 Fall" | "🌱 Spring" | "☀️ Summer";
    year: string;
    closedAccordion: string[];
    setClosedAccordion: (val: string[]) => void;
};

export default function SemesterAccordion({
                                              sem,
                                              season,
                                              year,
                                              closedAccordion,
                                              setClosedAccordion,
                                          }: Props) {
    const { plan, setPlan, cachedCourses } = useContext(PlanContext);

    const totalCredits = Math.max(
        4,
        sem.courses.reduce((sum, c) => sum + (cachedCourses[c.id]?.cred_min || 0 || 0), 0)
    );
    const { transposed } = useContext(DisplaySettingsContext);


    return (
        <Accordion
            multiple
            value={!closedAccordion.includes(sem.index) ? [sem.index] : []}
            onChange={(newValues) => {
                const updated = newValues.includes(sem.index)
                    ? closedAccordion.filter((id) => id !== sem.index)
                    : [...closedAccordion, sem.index];
                setClosedAccordion(updated);
            }}
            style={{
                width: "100%",
                background: "transparent",
                boxShadow: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
            }}
            styles={{
                content: { margin: 0, padding: 0 },
                item: {
                    border: "none",
                    margin: 0,
                    padding: 0,
                    minWidth: transposed === "row" ? "12rem" : "1rem", //necessary cause it will transpose automatically
                },
                control: {
                    textAlign: "center",
                    fontSize: "18px",
                    color: "#2D2A32",
                    background: SEMESTER_BACKGROUND,
                    border: "1px solid rgba(128, 128, 128, 0.2)",
                    padding: 12,
                    width: SEMESTER_BOX_WIDTH,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    display: "block",
                    marginBottom: 0,
                    paddingBottom: 12,
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                    borderBottomLeftRadius: !closedAccordion.includes(sem.index)
                        ? "0"
                        : "1rem",
                    borderBottomRightRadius: !closedAccordion.includes(sem.index)
                        ? "0"
                        : "1rem",
                },
                panel: {
                    padding: 0,
                    margin: 0,
                    background: "transparent",
                    boxShadow: "none",
                    border: "none",
                    display: "block",
                },
                chevron: { display: "none" },
            }}
        >
            <Accordion.Item value={sem.index}>
                <Accordion.Control>
                    <Text>
                        {season} {season === "🍂 Fall" ? year : parseInt(year) + 1}
                    </Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Droppable droppableId={sem.index}>
                        {(provided) => (
                            <Box
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                    background: SEMESTER_BACKGROUND,
                                    borderLeft: "1px solid rgba(128, 128, 128, 0.2)",
                                    borderRight: "1px solid rgba(128, 128, 128, 0.2)",
                                    borderBottom: "1px solid rgba(128, 128, 128, 0.2)",
                                    padding: 12,
                                    width: SEMESTER_BOX_WIDTH,
                                    minHeight: SEMESTER_BOX_MIN_HEIGHT,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                    marginTop: "0px",
                                    borderBottomLeftRadius: "1rem",
                                    borderBottomRightRadius: "1rem",
                                }}
                            >
                                <Flex style={{ width: "100%", gap: 2 }}>
                                    <Flex direction="column" align="flex-end">
                                        {Array.from({ length: totalCredits }).map((_, i) => (
                                            <Text
                                                key={i}
                                                style={{
                                                    fontSize: "10px",
                                                    color: "rgba(0, 0, 0, 0.35)",
                                                    height: CREDIT_LINE_HEIGHT,
                                                    lineHeight: CREDIT_LINE_HEIGHT,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {i + 1}
                                            </Text>
                                        ))}
                                    </Flex>
                                    <Flex
                                        direction="column"
                                        gap={COURSE_VERTICAL_GAP}
                                        style={{ width: "100%", alignItems: "center" }}
                                    >
                                        {sem.courses.map((course, j) => (
                                            <CourseCard
                                                key={`${sem.index}-${j}`}
                                                courseId={course.id}
                                                index={j}
                                                semName={sem.index}
                                                fixedWidth
                                                fontSize="15px"
                                                source="plan"
                                            />
                                        ))}
                                        {provided.placeholder}
                                    </Flex>
                                </Flex>
                            </Box>
                        )}
                    </Droppable>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
}