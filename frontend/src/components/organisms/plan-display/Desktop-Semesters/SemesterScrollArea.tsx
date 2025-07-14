import { ScrollArea, Flex } from "@mantine/core";
import {useContext, useState} from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { groupSemestersByYear } from "@/utils/PlanDisplayUtils/groupSemesterByYear";
import SemesterAccordion from "@/components/organisms/plan-display/Desktop-Semesters/SemesterAccordion";
import {Season, Semester} from "@/types/plan";
import theme from "@/styles/theme";

export default function SemesterScrollArea() {
    const { plan } = useContext(PlanContext);
    const { theSeasons } = useContext(DisplaySettingsContext)
    const { transposed } = useContext(DisplaySettingsContext);
    const [closedAccordion, setClosedAccordion] = useState<string[]>([]);
    const ALL_SEASONS: Season[] = ['🍂 Fall', '🌱 Spring', '☀️ Summer'];


    if (!plan) return null;

    const groupedByAcademicYear = groupSemestersByYear(plan.semesters);

    return (
        <ScrollArea
            style={{
                height: 'calc(100vh - 20rem)',
                overflow: 'auto',
            }}
            type="scroll"
            scrollbars="y"
            offsetScrollbars
            scrollHideDelay={0}
        >
            <Flex
                direction="row"
                align="flex-start"
                justify="center"
                gap={theme.planDisplayStyles.container.gap}
                wrap="wrap"
            >
                {Object.entries(groupedByAcademicYear)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([year, semGroupRaw]) => {
                        const semGroup = semGroupRaw as Record<'Fall' | 'Spring' | 'Summer', Semester | undefined>;
                        const { Fall, Spring, Summer } = semGroup;

                        return (
                            <Flex
                                key={year}
                                direction={transposed}
                                align="center"
                                justify="space-between"
                                gap={theme.planDisplayStyles.container.gap + 10}
                                wrap="nowrap"
                            >
                                {ALL_SEASONS.filter(season => !theSeasons.includes(season)).map((season) => {
                                    const sem = season === '🍂 Fall' ? Fall : season === '🌱 Spring' ? Spring : Summer;
                                    if (!sem) return null;

                                    return (
                                        <SemesterAccordion
                                            key={`${year}-${season}`}
                                            sem={sem}
                                            season={season}
                                            closedAccordion={closedAccordion}
                                            setClosedAccordion={setClosedAccordion}
                                            year={year}

                                        />
                                    );
                                })}
                            </Flex>
                        );
                    })}
            </Flex>
        </ScrollArea>
    );
}