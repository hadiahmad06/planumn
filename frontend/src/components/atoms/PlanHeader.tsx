"use client";

import { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Group,
  Menu,
  MultiSelect,
  Skeleton,
  Text,
} from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { formatDistanceToNow, isAfter } from "date-fns";
import { PlanContext } from "@/contexts/data/PlanContext";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";
import { useGlobalProgress } from "@/lib/progress/hooks";
import programOptions from "@/lib/programOptions.json";

export default function PlanHeader() {
  const planContext = useContext(PlanContext);
  const { programIds, setProgramIds, onUpdate } = useContext(PlanAuditContext);
  const { session } = useContext(UserSessionContext);

  if (!planContext.plan) {
    return <Skeleton h={72} w="100%" radius="md" />;
  }

  const { plan, setPlan, changesSaved, retryCount, setRetryCount, error } =
    planContext;

  const [titleLocal, setTitleLocal] = useState(plan.title);
  const [inputWidth, setInputWidth] = useState(1);
  const spanRef = useRef<HTMLSpanElement>(null);
  const placeholder = "Untitled plan";

  useEffect(() => {
    setTitleLocal(plan.title);
  }, [plan]);

  useEffect(() => {
    if (spanRef.current) setInputWidth(spanRef.current.offsetWidth + 4);
  }, [titleLocal]);

  const programLabel =
    programIds.length === 0
      ? "No program selected"
      : programIds.length === 1
      ? (programOptions as Array<{ label: string; value: string }>).find(
          (opt) => opt.value === programIds[0]
        )?.label ?? programIds[0]
      : `${programIds.length} programs`;

  const savedStatus = (() => {
    if (!session) return "Sign in to save to cloud";
    if (retryCount > 5) return "Saving disabled (retry limit)";
    if (error) return error;
    if (changesSaved && plan.last_updated) {
      return isAfter(Date.now(), plan.last_updated)
        ? `Saved ${formatDistanceToNow(plan.last_updated, { addSuffix: true })}`
        : "Saved just now";
    }
    return "Saving…";
  })();

  return (
    <Box
      style={{
        width: "100%",
        padding: "16px 24px",
        background: "transparent",
      }}
    >
      <Flex justify="space-between" align="flex-start" gap="md" wrap="nowrap">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Box style={{ position: "relative" }}>
              <input
                type="text"
                name="title"
                placeholder={placeholder}
                value={titleLocal}
                onChange={(e) => setTitleLocal(e.target.value)}
                onBlur={() => setPlan({ ...plan, title: titleLocal })}
                maxLength={64}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  margin: 0,
                  padding: 0,
                  fontWeight: 700,
                  fontSize: "var(--font-size-title)",
                  color: "var(--text-primary)",
                  width: Math.max(inputWidth, 80),
                  minWidth: "1ch",
                  borderBottom: "1px dashed transparent",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderBottomColor =
                    "var(--border-subtle)")
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderBottomColor =
                    "var(--border-subtle)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderBottomColor =
                    document.activeElement === e.currentTarget
                      ? "var(--border-subtle)"
                      : "transparent")
                }
              />
              <span
                ref={spanRef}
                style={{
                  visibility: "hidden",
                  position: "absolute",
                  whiteSpace: "pre",
                  fontWeight: 700,
                  fontSize: "var(--font-size-title)",
                  padding: 0,
                  margin: 0,
                }}
              >
                {titleLocal || placeholder}
              </span>
            </Box>
          </form>

          <Group gap="sm" align="center" mt={6}>
            <Menu shadow="md" position="bottom-start" width={360}>
              <Menu.Target>
                <Button
                  variant="default"
                  radius="xl"
                  size="xs"
                  rightSection={<IconChevronDown size={14} />}
                  styles={{
                    root: {
                      background: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    },
                  }}
                >
                  {programLabel}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Box p="xs">
                  <Text size="xs" c="dimmed" mb={6}>
                    Change program
                  </Text>
                  <MultiSelect
                    data={programOptions as any}
                    searchable
                    placeholder={
                      programIds.length === 0 ? "Select a program" : ""
                    }
                    value={programIds}
                    onChange={setProgramIds}
                    onBlur={onUpdate}
                    comboboxProps={{ withinPortal: false }}
                  />
                </Box>
              </Menu.Dropdown>
            </Menu>

            <Text
              size="sm"
              c={
                error || (retryCount > 5)
                  ? "var(--accent-primary)"
                  : "var(--text-secondary)"
              }
              style={{ cursor: error ? "pointer" : "default" }}
              onClick={() => {
                if (error) setRetryCount(retryCount + 1);
              }}
            >
              {savedStatus}
            </Text>
          </Group>
        </Box>

        <ProgressWidget />
      </Flex>
    </Box>
  );
}

function ProgressWidget() {
  const { met, total } = useGlobalProgress();
  const display = total > 0 ? `${met}/${total}` : "—/—";
  return (
    <Flex
      direction="column"
      align="flex-end"
      gap={2}
      style={{ flexShrink: 0, paddingLeft: 16 }}
    >
      <Text
        size="xs"
        tt="uppercase"
        c="var(--text-tertiary)"
        style={{ letterSpacing: "0.04em" }}
      >
        Requirements met
      </Text>
      <Text
        style={{
          fontWeight: 700,
          fontSize: "var(--font-size-title)",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        {display}
      </Text>
    </Flex>
  );
}
