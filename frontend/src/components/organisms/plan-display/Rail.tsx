"use client";

import { useContext } from "react";
import {
  Accordion,
  Box,
  Flex,
  ScrollArea,
  Text,
} from "@mantine/core";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";
import {
  RequirementProgress,
  RuleProgress,
  Satisfaction,
} from "@/lib/progress/requirementEvaluator";
import { useEvaluatedRequirements } from "@/lib/progress/hooks";
import { CourseDetails, ColorKey } from "@/types/plan";
import { ReqRule, ReqValue } from "@/types/program";
import { getCourseStripeColor } from "@/lib/colors";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import CourseCard from "@/components/molecules/CourseCard";

function ProgressRing({ met, total }: { met: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(1, met / total);
  const r = 9;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth="3"
      />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

function ruleProgressSum(ruleProgress: RuleProgress[]) {
  let met = 0;
  let total = 0;
  for (const rp of ruleProgress) {
    met += rp.slotsFilled;
    total += rp.slots;
  }
  return { met, total };
}

function collectLeafValues(value: ReqValue | undefined): string[] {
  if (!value) return [];
  const out: string[] = [];
  const visit = (v: any) => {
    if (!v) return;
    if (Array.isArray(v.values)) v.values.forEach(visit);
    if (Array.isArray(v.value)) {
      for (const s of v.value) if (typeof s === "string") out.push(s);
    } else if (typeof v.value === "string") {
      out.push(v.value);
    }
    if (Array.isArray(v.subSelections)) v.subSelections.forEach(visit);
  };
  visit(value);
  return out;
}

function isCourseIdLeaf(leaf: string): boolean {
  return /^\d+$/.test(leaf);
}

function RailDraggable({
  draggableId,
  index,
  courseId,
}: {
  draggableId: string;
  index: number;
  courseId: string;
}) {
  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <CourseCard
            courseId={courseId}
            isDraggable={false}
            fixedHeight
            fixedWidth={false}
            source="search"
          />
        </Box>
      )}
    </Draggable>
  );
}

function PatternRow({ leaf, sats }: { leaf: string; sats: Satisfaction[] }) {
  const matched = sats.filter((s) => s.leafValue === leaf && s.kind === "pattern");
  return (
    <Box
      style={{
        padding: "6px 8px",
        borderRadius: "var(--radius-sm)",
        fontStyle: "italic",
        color: "var(--text-secondary)",
      }}
    >
      <Text size="sm">
        Applied via pattern: <strong>{leaf}</strong>
        {matched.length > 0 && (
          <span style={{ marginLeft: 6 }}>
            ({matched.length} match{matched.length === 1 ? "" : "es"})
          </span>
        )}
      </Text>
    </Box>
  );
}

function RuleBlock({
  req,
  rule,
  rp,
  baseDraggableKey,
}: {
  req: RequirementProgress;
  rule: ReqRule;
  rp: RuleProgress;
  baseDraggableKey: string;
}) {
  const leaves = collectLeafValues(rule.value as any);
  const idLeaves = leaves.filter(isCourseIdLeaf);
  const patternLeaves = leaves.filter((l) => !isCourseIdLeaf(l));

  const operator =
    rule.condition === "minimumCourses"
      ? `any ${rule.minCourses ?? rule.courses ?? (rule.value as any)?.number ?? "?"} of`
      : rule.condition === "minimumCredits"
      ? `${rule.minCredits ?? rule.credits ?? "?"} cr of`
      : "all of";

  return (
    <Box mt="xs">
      <Flex justify="space-between" align="center" mb={4}>
        <Text size="sm" fw={600} c="var(--text-primary)">
          {rule.name || rule.condition}
        </Text>
        <Text size="xs" c="var(--text-secondary)">
          {rp.slotsFilled}/{rp.slots}
        </Text>
      </Flex>
      <Text size="xs" c="var(--text-tertiary)" mb={6}>
        {operator}
      </Text>
      <Flex direction="column" gap={4}>
        {idLeaves.map((leaf, idx) => (
          <RailDraggable
            key={`${baseDraggableKey}-${rule.id}-${leaf}-${idx}`}
            draggableId={`rail-${baseDraggableKey}-${rule.id}-${leaf}-${idx}`}
            index={idx}
            courseId={leaf}
          />
        ))}
        {patternLeaves.map((leaf, idx) => (
          <PatternRow
            key={`pattern-${rule.id}-${leaf}-${idx}`}
            leaf={leaf}
            sats={rp.matchedSatisfactions}
          />
        ))}
      </Flex>
    </Box>
  );
}

function RequirementAccordionItem({
  req,
  reqIdx,
}: {
  req: RequirementProgress;
  reqIdx: number;
}) {
  const { met, total } = ruleProgressSum(req.ruleProgress);

  return (
    <Accordion.Item value={req.group.id || String(reqIdx)}>
      <Accordion.Control>
        <Flex justify="space-between" align="center" gap="sm">
          <Flex align="center" gap="sm" style={{ minWidth: 0 }}>
            <ProgressRing met={met} total={total} />
            <Text fw={600} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {req.name}
            </Text>
          </Flex>
          <Text size="sm" c="var(--text-secondary)" style={{ flexShrink: 0 }}>
            {met}/{total}
          </Text>
        </Flex>
      </Accordion.Control>
      <Accordion.Panel>
        {req.renderMode === "clean" ? (
          <Flex direction="column" gap={4}>
            {req.ruleProgress.flatMap((rp, ruleIdx) => {
              const leaves = collectLeafValues(rp.rule.value as any);
              return leaves.map((leaf, idx) => (
                <RailDraggable
                  key={`${reqIdx}-${ruleIdx}-${leaf}-${idx}`}
                  draggableId={`rail-${reqIdx}-${ruleIdx}-${leaf}-${idx}`}
                  index={idx}
                  courseId={leaf}
                />
              ));
            })}
          </Flex>
        ) : (
          req.ruleProgress.map((rp, ruleIdx) => (
            <RuleBlock
              key={ruleIdx}
              req={req}
              rule={rp.rule}
              rp={rp}
              baseDraggableKey={`${reqIdx}-${ruleIdx}`}
            />
          ))
        )}
      </Accordion.Panel>
    </Accordion.Item>
  );
}

export default function Rail() {
  const requirements = useEvaluatedRequirements();
  const { dataFetched } = useContext(PlanAuditContext);

  return (
    <Box
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Text
          size="xs"
          tt="uppercase"
          c="var(--text-tertiary)"
          fw={600}
          style={{ letterSpacing: "0.04em" }}
        >
          Requirements
        </Text>
      </Box>
      <ScrollArea style={{ flex: 1 }} type="scroll" offsetScrollbars>
        <Droppable droppableId="rail" isDropDisabled>
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps} p="sm">
              {requirements.length === 0 ? (
                <Text size="sm" c="var(--text-tertiary)" p="md">
                  {dataFetched ? "No requirements." : "Loading…"}
                </Text>
              ) : (
                <Accordion variant="filled" chevronPosition="right" multiple>
                  {requirements.map((req, idx) => (
                    <RequirementAccordionItem
                      key={req.group.id || idx}
                      req={req}
                      reqIdx={idx}
                    />
                  ))}
                </Accordion>
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </ScrollArea>
    </Box>
  );
}
