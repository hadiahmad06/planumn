"use client";

import { useContext } from "react";
import { Accordion, Box, Flex, Text, UnstyledButton } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";
import {
  RequirementProgress,
  RuleProgress,
} from "@/lib/progress/requirementEvaluator";
import { useEvaluatedRequirements } from "@/lib/progress/hooks";
import { ReqRule, ReqValue } from "@/types/program";
import { requestMobileAdd } from "@/components/molecules/MobileAddPicker";

function ringProgress(rp: RuleProgress[]) {
  let met = 0;
  let total = 0;
  for (const r of rp) {
    met += r.slotsFilled;
    total += r.slots;
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

function CourseRow({ leafId }: { leafId: string }) {
  const { cachedReqCourses } = useContext(PlanAuditContext);
  const details = cachedReqCourses[leafId];

  if (!details) {
    return (
      <Box
        style={{
          padding: "8px 10px",
          color: "var(--text-tertiary)",
          fontSize: "var(--font-size-body)",
        }}
      >
        Loading {leafId}…
      </Box>
    );
  }

  const label = `${details.dept_abbr} ${details.course_num}`;

  return (
    <UnstyledButton
      onClick={() =>
        requestMobileAdd({
          course: { id: details.id },
          label,
        })
      }
      style={{
        padding: "10px 12px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <Box style={{ minWidth: 0 }}>
        <Text style={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "var(--text-primary)" }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: "var(--font-size-micro)",
            color: "var(--text-tertiary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {details.class_desc}
        </Text>
      </Box>
      <IconPlus size={16} color="var(--accent-primary)" />
    </UnstyledButton>
  );
}

function PatternRow({ leaf }: { leaf: string }) {
  return (
    <Box
      style={{
        padding: "8px 10px",
        fontStyle: "italic",
        color: "var(--text-secondary)",
        fontSize: "var(--font-size-body)",
      }}
    >
      Applied via pattern: <strong>{leaf}</strong>
    </Box>
  );
}

function RuleBlock({ rule, rp }: { rule: ReqRule; rp: RuleProgress }) {
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
        <Text style={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "var(--text-primary)" }}>
          {rule.name || rule.condition}
        </Text>
        <Text style={{ fontSize: "var(--font-size-micro)", color: "var(--text-secondary)" }}>
          {rp.slotsFilled}/{rp.slots}
        </Text>
      </Flex>
      <Text style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", marginBottom: 6 }}>
        {operator}
      </Text>
      <Flex direction="column" gap={4}>
        {idLeaves.map((leaf, idx) => (
          <CourseRow key={`${rule.id}-${leaf}-${idx}`} leafId={leaf} />
        ))}
        {patternLeaves.map((leaf, idx) => (
          <PatternRow key={`pattern-${rule.id}-${leaf}-${idx}`} leaf={leaf} />
        ))}
      </Flex>
    </Box>
  );
}

function RequirementItem({ req, reqIdx }: { req: RequirementProgress; reqIdx: number }) {
  const { met, total } = ringProgress(req.ruleProgress);

  return (
    <Accordion.Item value={req.group.id || String(reqIdx)}>
      <Accordion.Control>
        <Flex justify="space-between" align="center" gap="sm">
          <Text fw={600} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {req.name}
          </Text>
          <Text style={{ fontSize: "var(--font-size-micro)", color: "var(--text-secondary)", flexShrink: 0 }}>
            {met}/{total}
          </Text>
        </Flex>
      </Accordion.Control>
      <Accordion.Panel>
        {req.renderMode === "clean" ? (
          <Flex direction="column" gap={4}>
            {req.ruleProgress.flatMap((rp, ruleIdx) =>
              collectLeafValues(rp.rule.value as any).map((leaf, idx) => (
                <CourseRow key={`${reqIdx}-${ruleIdx}-${leaf}-${idx}`} leafId={leaf} />
              ))
            )}
          </Flex>
        ) : (
          req.ruleProgress.map((rp, ruleIdx) => (
            <RuleBlock key={ruleIdx} rule={rp.rule} rp={rp} />
          ))
        )}
      </Accordion.Panel>
    </Accordion.Item>
  );
}

export default function MobileRailSection() {
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
      }}
    >
      <Accordion variant="filled" chevronPosition="right" multiple>
        <Accordion.Item value="__rail__">
          <Accordion.Control>
            <Text
              style={{
                fontSize: "var(--font-size-micro)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-tertiary)",
                fontWeight: 600,
              }}
            >
              Requirements
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            {requirements.length === 0 ? (
              <Text style={{ fontSize: "var(--font-size-body)", color: "var(--text-tertiary)", padding: 12 }}>
                {dataFetched ? "No requirements." : "Loading…"}
              </Text>
            ) : (
              <Accordion variant="separated" chevronPosition="right" multiple>
                {requirements.map((req, idx) => (
                  <RequirementItem
                    key={req.group.id || idx}
                    req={req}
                    reqIdx={idx}
                  />
                ))}
              </Accordion>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
}
