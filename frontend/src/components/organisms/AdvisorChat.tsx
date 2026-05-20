"use client";

import { useContext, useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Box,
  CloseButton,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconMessageCircle, IconSend } from "@tabler/icons-react";
import { PlanContext } from "@/contexts/data/PlanContext";

type Message = { role: "user" | "assistant"; content: string };

const DEFAULT_MODEL = "qwen/qwen3.5-9b";

const TOOL_LABELS: Record<string, string> = {
  search_courses: "Searching courses...",
  get_course_details: "Looking up course details...",
  get_plan_info: "Reading your plan...",
  check_prerequisites: "Checking prerequisites...",
};

export default function AdvisorChat() {
  const { plan, cachedCourses } = useContext(PlanContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollViewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollViewport.current?.scrollTo({
      top: scrollViewport.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, toolStatus]);

  async function handleSubmit() {
    if (!input.trim() || isLoading || !plan) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];
    // Add placeholder for streaming assistant reply
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);
    setToolStatus(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          plan,
          courseNames: Object.fromEntries(
            Object.entries(cachedCourses).map(([id, c]) => [
              id,
              { dept_abbr: c.dept_abbr, course_num: c.course_num, cred_min: c.cred_min, cred_max: c.cred_max },
            ])
          ),
          model: DEFAULT_MODEL,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Handle both LF and CRLF-delimited SSE chunks
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const rawPart of parts) {
          const part = rawPart.trim();
          if (!part) continue;

          // An SSE event can be multiple lines, but we only care about `data:` lines
          const dataLines = part
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("data:"));

          for (const line of dataLines) {
            const payload = line.slice("data:".length).trimStart();
            if (!payload) continue;

            let event: Record<string, string>;
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }

            if (event.type === "token") {
              assistantContent += event.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            } else if (event.type === "tool_start") {
              setToolStatus(TOOL_LABELS[event.name] ?? `Using ${event.name}...`);
            } else if (event.type === "tool_end") {
              setToolStatus(null);
            } else if (event.type === "done") {
              // stream complete — nothing extra needed
            } else if (event.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent || `Error: ${event.message}`,
                };
                return updated;
              });
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Network error. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setToolStatus(null);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <ActionIcon
        size="xl"
        radius="var(--radius-pill)"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1100,
          background: "var(--accent-primary)",
          color: "var(--bg-surface)",
          boxShadow: "var(--shadow-overlay)",
        }}
        onClick={() => setIsOpen((o) => !o)}
        title="AI Advisor"
      >
        <IconMessageCircle size={22} />
      </ActionIcon>

      {/* Chat panel */}
      {isOpen && (
        <Paper
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            width: 380,
            height: 520,
            zIndex: 1100,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          {/* Header */}
          <Group
            justify="space-between"
            px="var(--space-2)"
            py="var(--space-1)"
            style={{
              backgroundColor: "var(--rose-100)",
              borderBottom: "1px solid var(--border-subtle)",
              flexShrink: 0,
            }}
          >
            <Group gap={6}>
              <IconMessageCircle size={17} color="var(--accent-primary)" />
              <Text
                fw={600}
                style={{
                  fontSize: "var(--font-size-body)",
                  color: "var(--accent-primary)",
                }}
              >
                AI Advisor
              </Text>
            </Group>
            <CloseButton size="sm" onClick={() => setIsOpen(false)} />
          </Group>

          {/* Messages */}
          <ScrollArea flex={1} viewportRef={scrollViewport} p="var(--space-2)">
            <Stack gap="var(--space-1)">
              {messages.length === 0 && (
                <Text
                  ta="center"
                  mt="xl"
                  style={{
                    fontSize: "var(--font-size-body)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  Ask me about your courses, requirements, or graduation plan.
                </Text>
              )}
              {messages.map((msg, i) => {
                // Hide the placeholder assistant message while we are still waiting
                if (msg.role === "assistant" && msg.content === "") {
                  return null;
                }

                const isUser = msg.role === "user";
                return (
                  <Box
                    key={i}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      backgroundColor: isUser ? "var(--rose-100)" : "var(--bg-canvas)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                      padding: "8px 12px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "var(--font-size-body)",
                        whiteSpace: "pre-wrap",
                        color: "var(--text-primary)",
                      }}
                    >
                      {msg.content}
                    </Text>
                  </Box>
                );
              })}

              {/* Tool status indicator */}
              {toolStatus && (
                <Box
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "var(--rose-100)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Loader size={12} color="var(--accent-primary)" />
                  <Text
                    style={{
                      fontSize: "var(--font-size-micro)",
                      color: "var(--accent-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {toolStatus}
                  </Text>
                </Box>
              )}

              {/* Typing indicator while waiting for first token */}
              {isLoading && !toolStatus && messages[messages.length - 1]?.content === "" && (
                <Box
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "var(--bg-canvas)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px 12px 12px 4px",
                    padding: "8px 12px",
                  }}
                >
                  <Loader size="xs" type="dots" color="var(--accent-primary)" />
                </Box>
              )}
            </Stack>
          </ScrollArea>

          {/* Input */}
          <Box
            px="var(--space-2)"
            pb="var(--space-2)"
            pt="var(--space-1)"
            style={{
              borderTop: "1px solid var(--border-subtle)",
              flexShrink: 0,
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <Group gap="xs" align="flex-end">
              <Textarea
                flex={1}
                size="sm"
                placeholder={plan ? "Ask about your plan..." : "Load a plan to start chatting"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                autosize
                minRows={1}
                maxRows={3}
                disabled={isLoading || !plan}
              />
              <ActionIcon
                size="lg"
                radius="var(--radius-md)"
                onClick={handleSubmit}
                disabled={isLoading || !input.trim() || !plan}
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-surface)",
                }}
              >
                <IconSend size={15} />
              </ActionIcon>
            </Group>
          </Box>
        </Paper>
      )}
    </>
  );
}
