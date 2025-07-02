"use client";

import { Accordion, Box, Collapse, Container, Flex, Group, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { ColorKey, Course, CourseDetails } from '@/types/plan';
import SearchBar from '@/components/molecules/SearchBar';
import CoursePreviewPanel from '@/components/organisms/CoursePreviewPanel';
import { useState, useEffect, useContext } from "react";
import { usePathname } from "next/navigation";
import AnimatedTypingText from '../atoms/landing/AnimatedTypingTest';
import { PlanAuditContext } from '@/contexts/data/PlanAuditContext';
import { ReqCondition, ReqRule } from '@/types/program';

export default function SearchLayout() {
  const { reqGroups } = useContext(PlanAuditContext);

  function renderReqCondition(condition: ReqCondition) {
    if (!condition) return null;

    return (
      <Group w="100%" wrap="wrap">
        {condition.values && Array.isArray(condition.values) && condition.values.length > 0 && (
          <>
            {typeof condition.values[0] !== 'string' ? (
              condition.values.map((valObj: any, idx: number) => (
                <Box key={idx}>
                  {Array.isArray(valObj.value) ? (
                    <Group w="100%" wrap="nowrap" gap="0.5rem">
                      {valObj.value.map((code: string, j: number) => (
                        <Group key={j} align="center" gap="0.5rem">
                          <Box
                            px="xs"
                            py={4}
                            style={{ 
                              backgroundColor: "#d0d0d0", 
                              borderRadius: "0.5rem",
                              borderLeft: 'logic' in valObj && valObj.value.length < 2 ? "2px solid #000000" : (j === 0 ? "2px solid #000000" : "0px solid #000000"),
                              borderRight: 'logic' in valObj && valObj.value.length < 2 ? "2px solid #000000" : (j === valObj.value.length - 1 ? "2px solid #000000" : "0px solid #000000"),
                            }}
                          >
                            {code}
                          </Box>
                          {'logic' in valObj && j !== valObj.value.length - 1 && (
                            <Text ta="center" fw={600}>{valObj.logic}</Text>
                          )}
                        </Group>
                      ))}
                    </Group>
                  ) : null}
                </Box>
              ))
            ) : (<></>)}
          </>
        )}
        {condition.number !== undefined && <p><strong>Number Required:</strong> {condition.number}</p>}
        {condition.subSelections && condition.subSelections.map((sub, idx) => (
          <Box key={idx} style={{ paddingLeft: "0.75rem", marginTop: "0.5rem" }}>
            {renderReqCondition(sub)}
          </Box>
        ))}
      </Group>
    );
  }

  function renderReqRules(rules: ReqRule[]) {
    return rules.map((rule, idx) => (
      <Box key={idx} style={{ padding: "0.5rem", borderRadius: "1rem" }}>
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
          {renderReqCondition(rule.value)}
        </>
        {Array.isArray(rule.subRules) && rule.subRules.length > 0 && (
          <Box>
            <p><strong>Sub-Rules:</strong></p>
            {renderReqRules(rule.subRules)}
          </Box>
        )}
      </Box>
    ));
  }

  const items = (reqGroups["requisitesSimple"] || []).map((requisite, index) => (
    <Box
      key={requisite.id || index}
    >
      <Accordion.Item key={requisite.id || index} value={requisite.name} 
        style={{
          backgroundColor: index % 2 === 0 ? "#f8f8f8f9" : "#e8e8e8f9",
          borderRadius: "1rem",
          border: "0px solid #000000",
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Accordion.Control>
          <Flex justify="space-between" align="center" >
            <Title order={4}>{requisite.name}</Title>
            <Box style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {requisite.type}
            </Box>
          </Flex>
        </Accordion.Control>
        <Accordion.Panel>
          {requisite.notes && 
          <Box>
            <p><strong>Notes:</strong></p>
            <div dangerouslySetInnerHTML={{ __html: requisite.notes }} />
          </Box>}
          {renderReqRules(requisite.rules)}
        </Accordion.Panel>
      </Accordion.Item>
    </Box>
  ))

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
      <ScrollArea
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
    </Stack>
  );
}