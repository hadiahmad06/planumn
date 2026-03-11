"use client";

import { Accordion, Box, Flex, Group, ScrollArea, Stack, Text, Title, Badge, ThemeIcon, TextInput, ActionIcon, Select } from '@mantine/core';
import { IconCheck, IconClock, IconX, IconSearch, IconX as IconClose, IconFilter, IconChartBar, IconPlus, IconCopy, IconExternalLink } from '@tabler/icons-react';
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { ColorKey, Course, CourseDetails, CourseStub } from '@/types/plan';
import SearchBar from '@/components/molecules/SearchBar';
import CoursePreviewPanel from '@/components/organisms/CoursePreviewPanel';
import { useState, useEffect, useContext } from "react";
import { usePathname } from "next/navigation";
import AnimatedTypingText from '../atoms/landing/AnimatedTypingTest';
import { PlanAuditContext } from '@/contexts/data/PlanAuditContext';
import { PlanContext } from '@/contexts/data/PlanContext';
import { ReqCondition, ReqRule, ReqGroup } from '@/types/program';
import CourseCard from '../molecules/CourseCard';
import styles from './programRequirements.module.css';
import ProgressDashboard from './ProgressDashboard';
import { MenuRow } from "@/components/atoms/ContextMenu";
import { notifications } from "@mantine/notifications";

type FilterStatus = 'all' | 'completed' | 'inProgress' | 'notStarted';

export default function SearchLayout() {
  const { reqGroups, requirementCompletion, courseAlternatives } = useContext(PlanAuditContext);
  const { plan, setPlan, cachedCourses } = useContext(PlanContext);
  const [collapsedItems, setCollapsedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showDashboard, setShowDashboard] = useState<boolean>(false);

  const getAlternativeInfo = (courseCode: string, reqId: string) => {
    const alternatives = courseAlternatives[reqId] || [];
    for (const altGroup of alternatives) {
      if (altGroup.courses.includes(courseCode)) {
        return altGroup;
      }
    }
    return null;
  };

  const isAlternativeCourse = (courseCode: string, reqId: string): boolean => {
    return getAlternativeInfo(courseCode, reqId) !== null;
  };

  const isPlannedAlternative = (courseCode: string, reqId: string): boolean => {
    const altGroup = getAlternativeInfo(courseCode, reqId);
    return altGroup?.plannedCourse === courseCode;
  };



  const handleAddToPlan = (courseCode: string) => {
    if (!plan) {
      notifications.show({
        title: "Error",
        message: "No plan loaded",
        color: "red",
      });
      return;
    }

    const firstSemester = plan.semesters[0];
    if (!firstSemester) {
      notifications.show({
        title: "Error",
        message: "No semesters available",
        color: "red",
      });
      return;
    }

    const [dept, num] = courseCode.split(" ");

    const courseDetails = Object.values(cachedCourses).find(
      c => c.dept_abbr === dept && c.course_num === num
    );

    if (!courseDetails) {
      notifications.show({
        title: "Error",
        message: "Course details not found",
        color: "red",
      });
      return;
    }

    const updated = { ...plan, semesters: [...plan.semesters] };
    const sem = updated.semesters.find((s) => s.index === firstSemester.index);
    if (sem) {
      sem.courses.push({
        id: courseDetails.id,
        lock: "unlocked",
      });
      setPlan(updated);
      notifications.show({
        title: "Success",
        message: `Added ${courseCode} to ${firstSemester.index}`,
        color: "green",
      });
    }
  };

  const handleCopyCourseCode = (courseCode: string) => {
    navigator.clipboard.writeText(courseCode).then(() => {
      notifications.show({
        title: "Copied",
        message: courseCode,
        color: "green",
      });
    });
  };

  const handleOpenInCatalog = (courseCode: string) => {
    const [dept, num] = courseCode.split(" ");
    window.open(`https://onestop2.umn.edu/psp/ps/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL?Page=CLASS_SRCH_WRK2_SSRPB_SCR_DESCR&Action=U&ACAD_YEAR=2024&STRM=1249&SUBJ=${dept}&CATALOG_NBR=${num}`, "_blank");
  };

  const getContextMenuRows = (courseCode: string): MenuRow[] => [
    {
      buttons: [
        {
          label: "Add to Plan",
          icon: <IconPlus size={16} />,
          onClick: () => handleAddToPlan(courseCode),
          color: "green",
        },
        {
          label: "Copy Course Code",
          icon: <IconCopy size={16} />,
          onClick: () => handleCopyCourseCode(courseCode),
        },
        {
          label: "Open in Catalog",
          icon: <IconExternalLink size={16} />,
          onClick: () => handleOpenInCatalog(courseCode),
        },
      ],
    },
  ];

  function renderReqCondition(condition: ReqCondition, reqId?: string) {
    if (!condition) return null;

    const getCompletedCoursesSet = () => {
      const completedSet = new Set<string>();
      Object.values(requirementCompletion).forEach(status => {
        if (status.completedCourses) {
          status.completedCourses.forEach(course => completedSet.add(course));
        }
      });
      return completedSet;
    };

    const completedCourses = getCompletedCoursesSet();

    return (
      <Group w="100%" wrap="wrap">
        {condition.values && Array.isArray(condition.values) && condition.values.length > 0 && (
          <>
            {typeof condition.values[0] !== 'string' ? (
              condition.values.map((valObj: any, idx: number) => (
                <Box key={idx}>
                  {Array.isArray(valObj.value) ? (
                    <Droppable droppableId={`program-${idx}`}>
                      {(provided) => (
                        <Group ref={provided.innerRef} wrap="nowrap" gap="0.5rem">
                          {valObj.value.map((code: string, j: number) => (
                            <Group key={`program-${idx}-course-${j}`} wrap="nowrap" gap="0.5rem">
                              <Draggable
                                key={`program-${idx}-course-${j}`}
                                draggableId={code}
                                index={j}
                              >
                                {(provided) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      backgroundColor: "#d0d0d0",
                                      borderRadius: "0.5rem",
                                      boxShadow: valObj.value.length > 1 ? [
                                        j === 0 && "-2px 0 0 0 #000000",
                                        j === valObj.value.length - 1 && "2px 0 0 0 #000000"
                                      ].filter(Boolean).join(", ") : "",
                                      borderLeft: (j === 0 && valObj.value.length > 1 ? "2px solid #ffffff" : "0px solid #ffffff"),
                                      borderRight: (j === valObj.value.length -1 && valObj.value.length > 1 ? "2px solid #ffffff" : "0px solid #ffffff"),
                                      position: 'relative'
                                    }}
                                  >
<CourseCard
                                      courseId={code}
                                      isDraggable={true}
                                      fixedHeight={true}
                                      fixedWidth={true}
                                      isCompleted={completedCourses.has(code)}
                                      isAlternative={isAlternativeCourse(code, reqId || '')}
                                      isPlannedAlternative={isPlannedAlternative(code, reqId || '')}
                                    />
                                  </Box>
                                )}
                              </Draggable>
                              {'logic' in valObj && valObj.value.length > 1 && j !== valObj.value.length - 1 && (
                                <Text ta="center" fw={600}>{valObj.logic}</Text>
                              )}
                            </Group>
                          ))}
                        </Group>
                      )}
                    </Droppable>
                  ) : null}
                </Box>
              ))
            ) : (<></>)}
          </>
        )}
        {condition.number !== undefined && <p><strong>Number Required:</strong> {condition.number}</p>}
        {condition.subSelections && condition.subSelections.map((sub, idx) => (
          <Box key={idx} style={{ paddingLeft: "0.75rem", marginTop: "0.5rem" }}>
            {renderReqCondition(sub, reqId)}
          </Box>
        ))}
      </Group>
    );
  }

  function renderReqRules(rules: ReqRule[], reqId?: string) {
    return rules.map((rule, idx) => (
      <Box key={idx} className={styles.ruleContainer}>
        {/* When a rule.length === 1, the subrules are the only important ones (i think, idrk) */}
        {rules.length > 1 && (
          <p><strong>{rule.name}</strong></p>
        )}
        <>
          {/* {rule.condition} */}
          {(rule.credits !== undefined || rule.courses !== undefined) ? (
            <Box>
              <p>
                <strong>Courses/Credits:</strong>{' '}
                Needs
                {rule.credits !== undefined && ` ${rule.credits} credit${rule.credits === 1 ? '' : 's'}`}
                {rule.credits !== undefined && rule.courses !== undefined && ' in'}
                {rule.courses !== undefined && ` ${rule.courses} course${rule.courses === 1 ? '' : 's'}`}
              </p>
            </Box>
          ) : (rule.minCredits !== undefined || rule.maxCredits !== undefined || rule.minCourses !== undefined || rule.maxCourses !== undefined) && (
            <Box>
              <p>
                <strong>Courses/Credits:</strong>{' '}
                Requires
                {rule.minCredits !== undefined && rule.maxCredits !== undefined
                  ? rule.minCredits === rule.maxCredits
                    ? ` ${rule.maxCredits} credit${rule.maxCredits === 1 ? '' : 's'}`
                    : ` ${rule.minCredits}-${rule.maxCredits} credits`
                  : rule.minCredits !== undefined
                    ? ` ${rule.minCredits} credit${rule.minCredits === 1 ? '' : 's'}`
                    : rule.maxCredits !== undefined
                      ? ` ${rule.maxCredits} credit${rule.maxCredits === 1 ? '' : 's'}`
                      : ''}
                {(rule.minCredits !== undefined || rule.maxCredits !== undefined) &&
                  (rule.minCourses !== undefined || rule.maxCourses !== undefined) && ' in '}
                {rule.minCourses !== undefined && rule.maxCourses !== undefined
                  ? rule.minCourses === rule.maxCourses
                    ? ` ${rule.maxCourses} course${rule.maxCourses === 1 ? '' : 's'}`
                    : ` ${rule.minCourses}-${rule.maxCourses} courses`
                  : rule.minCourses !== undefined
                    ? ` ${rule.minCourses} course${rule.minCourses === 1 ? '' : 's'}`
                    : rule.maxCourses !== undefined
                      ? ` ${rule.maxCourses} course${rule.maxCourses === 1 ? '' : 's'}`
                      : ''}
              </p>
            </Box>
          )}
          {rule.description && (
            <Box>
              {/* <p><strong>Description:</strong></p> */}
              <div dangerouslySetInnerHTML={{ __html: rule.description }} />
            </Box>
          )}
          {rule.notes && (
            <Box>
              {/* <p><strong>Notes:</strong></p> */}
              <div dangerouslySetInnerHTML={{ __html: rule.notes }} />
            </Box>
          )}
          {renderReqCondition(rule.value, reqId)}
        </>
        {Array.isArray(rule.subRules) && rule.subRules.length > 0 && (
          <Box>
            <p><strong>Sub-Rules:</strong></p>
            {renderReqRules(rule.subRules, reqId)}
          </Box>
        )}
      </Box>
    ));
  }

  const filterRequirements = (requisites: ReqGroup[]): ReqGroup[] => {
    return requisites.filter((requisite) => {
      const completion = requirementCompletion[requisite.id];
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = requisite.name?.toLowerCase().includes(query);
        const matchesNotes = requisite.notes?.toLowerCase().includes(query);
        const matchesType = requisite.type?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesNotes && !matchesType) {
          return false;
        }
      }
      
      if (filterStatus !== 'all' && completion) {
        if (filterStatus === 'completed' && !completion.completed) {
          return false;
        }
        if (filterStatus === 'inProgress' && (completion.completed || completion.completionPercentage === 0)) {
          return false;
        }
        if (filterStatus === 'notStarted' && completion.completionPercentage > 0) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredRequisites = filterRequirements(reqGroups["requisitesSimple"] || []);

  const items = filteredRequisites.map((requisite, index) => {
    const completion = requirementCompletion[requisite.id];
    const isCollapsed = collapsedItems.includes(requisite.name);

    const getCompletionBadge = () => {
      if (!completion) return null;

      if (completion.completed) {
        return (
          <Badge
            color="green"
            variant="filled"
            leftSection={<IconCheck size={12} />}
          >
            Complete
          </Badge>
        );
      }

      if (completion.completionPercentage > 0) {
        return (
          <Badge
            color="yellow"
            variant="filled"
            leftSection={<IconClock size={12} />}
          >
            {Math.round(completion.completionPercentage)}%
          </Badge>
        );
      }

      return (
        <Badge
          color="gray"
          variant="light"
          leftSection={<IconX size={12} />}
        >
          Not started
        </Badge>
      );
    };

    const getSubRequirementSummary = () => {
      if (!isCollapsed || !requisite.rules || requisite.rules.length === 0) return null;

      const completedCount = requisite.rules.filter((rule, idx) => {
        const ruleId = `${requisite.id}-rule-${idx}`;
        return requirementCompletion[ruleId]?.completed;
      }).length;

      const totalRules = requisite.rules.length;

      if (totalRules > 1) {
        return (
          <Box mt="xs" ml="xs">
            <Badge size="xs" color="blue" variant="light">
              {completedCount}/{totalRules} sub-requirements
            </Badge>
          </Box>
        );
      }

      return null;
    };

    return (
      <Box
        key={requisite.id || index}
      >
        <Accordion.Item
          key={requisite.id || index}
          value={requisite.name}
          onChange={(value) => {
            if (!value) {
              setCollapsedItems([...collapsedItems, requisite.name]);
            } else {
              setCollapsedItems(collapsedItems.filter(item => item !== requisite.name));
            }
          }}
          className={`${styles.requirementItem} ${completion?.completed ? styles.requirementCompleted : ''} ${completion?.completionPercentage > 0 && !completion?.completed ? styles.requirementInProgress : ''} ${completion?.completionPercentage === 0 ? styles.requirementNotStarted : ''}`}
          style={{
            backgroundColor: index % 2 === 0 ? "#f8f8f8f9" : "#e8e8e8f9",
            borderRadius: "1rem",
            border: completion?.completed ? "2px solid #10b981" : "0px solid #000000",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Accordion.Control className={styles.accordionControl}>
            <Flex justify="space-between" align="center" gap="sm">
              <Title order={4}>{requisite.name}</Title>
              <Flex gap="sm" align="center">
                <Box style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {requisite.type}
                </Box>
                <Box className={styles.completionBadge}>
                  {getCompletionBadge()}
                </Box>
              </Flex>
            </Flex>
            {getSubRequirementSummary()}
          </Accordion.Control>
          <Accordion.Panel>
            {requisite.notes &&
            <Box className={styles.notesContainer}>
              <p><strong>Notes:</strong></p>
              <div dangerouslySetInnerHTML={{ __html: requisite.notes }} />
            </Box>}
            {renderReqRules(requisite.rules, requisite.id)}
          </Accordion.Panel>
        </Accordion.Item>
      </Box>
    );
  })

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getFilteredCount = (): number => {
    return filteredRequisites.length;
  };

  const getTotalCount = (): number => {
    return (reqGroups["requisitesSimple"] || []).length;
  };

  return (
    <Stack
      justify="space-between"
      align="stretch"
    >
      <Droppable droppableId="search">
        {(provided) => (
          <Box
            ref={provided.innerRef}
            style={{
            }}
          >
            <Title
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#0f172a",
              marginBottom: "0.5rem",
            }}
            >
              <AnimatedTypingText blink={false}/>
            </Title>
            <SearchBar/>
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      <Box className={styles.filtersSection}>
        <Flex gap="sm" align="center" wrap="wrap">
          <TextInput
            placeholder="Search requirements..."
            leftSection={<IconSearch size={16} />}
            rightSection={
              searchQuery && (
                <ActionIcon size="sm" onClick={clearSearch} variant="subtle">
                  <IconClose size={14} />
                </ActionIcon>
              )
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
            size="sm"
          />
          <Select
            placeholder="Filter by status"
            leftSection={<IconFilter size={16} />}
            data={[
              { value: 'all', label: 'All Requirements' },
              { value: 'completed', label: 'Completed' },
              { value: 'inProgress', label: 'In Progress' },
              { value: 'notStarted', label: 'Not Started' },
            ]}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as FilterStatus)}
            size="sm"
            style={{ minWidth: 140 }}
            allowDeselect={false}
          />
          <ActionIcon
            variant={showDashboard ? "filled" : "light"}
            color="blue"
            onClick={() => setShowDashboard(!showDashboard)}
            size="lg"
            title="Toggle Progress Dashboard"
          >
            <IconChartBar size={20} />
          </ActionIcon>
        </Flex>
        <Text size="xs" c="dimmed" mt="xs">
          Showing {getFilteredCount()} of {getTotalCount()} requirements
        </Text>
      </Box>

      {showDashboard && <ProgressDashboard />}
      {/* <Droppable droppableId="program">
        {(provided) => ( */}
          <ScrollArea
            // ref={provided.innerRef}
            offsetScrollbars
            scrollbarSize={8}
            styles={{ scrollbar: { backgroundColor: "#f1f5f9" } }}
            h="80vh"
            style={{
              // marginTop: "1rem",
              // marginBottom: "1rem",
              // paddingRight: "0.5rem",
            }}
          >
            <Stack gap="sm">
              <Accordion defaultValue="Core Requisites" variant="filled" chevronPosition="left">
                {items}
              </Accordion>
            </Stack>
          </ScrollArea>
        {/* )}
      </Droppable> */}
    </Stack>
  );
}