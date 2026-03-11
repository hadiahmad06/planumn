import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createToolSet } from "@/lib/tools";
import type { CourseName } from "@/lib/tools";
import type { PlanNullable } from "@/types/plan";

type ChatRequest = {
  messages: { role: "user" | "assistant"; content: string }[];
  plan: PlanNullable;
  courseNames: Record<string, CourseName>;
  model: string;
};

const SYSTEM_PROMPT = `You are an academic advisor for University of Minnesota students using planu.mn.
Help students plan their graduation, evaluate course sequences, and check degree requirements.
You have tools to search courses, look up details, retrieve the student's plan, and validate prerequisites.

Guidelines:
- Use get_plan_info when asked about the student's schedule or specific semesters.
- Use check_prerequisites before recommending a course sequence to verify it is valid.
- Use search_courses + get_course_details to answer questions about specific courses.
- You CANNOT modify the student's plan — only advise.
- Be concise and practical. Cite specific courses and semesters when relevant.

Today's date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`;

const MAX_ITERATIONS = 5;

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "OPENROUTER_API_KEY is not configured" })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Invalid request body" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { messages, plan, courseNames, model } = body;
  const { tools, executeTool } = createToolSet(plan, courseNames ?? {});

  const conversation: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const client = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const response = await client.chat.completions.create({
            model,
            messages: conversation,
            tools,
            tool_choice: "auto",
            stream: true,
          });

          // Accumulate the streamed response
          let content = "";
          const toolCallsAccum: Record<
            number,
            { id: string; name: string; arguments: string }
          > = {};

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
              content += delta.content;
              send({ type: "token", content: delta.content });
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!toolCallsAccum[tc.index]) {
                  toolCallsAccum[tc.index] = {
                    id: tc.id ?? "",
                    name: tc.function?.name ?? "",
                    arguments: "",
                  };
                  // Notify client a tool is starting
                  if (tc.function?.name) {
                    send({ type: "tool_start", name: tc.function.name });
                  }
                }
                if (tc.id) toolCallsAccum[tc.index].id = tc.id;
                if (tc.function?.name) toolCallsAccum[tc.index].name = tc.function.name;
                if (tc.function?.arguments)
                  toolCallsAccum[tc.index].arguments += tc.function.arguments;
              }
            }
          }

          const toolCalls = Object.values(toolCallsAccum);

          // Push assistant turn to conversation
          if (toolCalls.length > 0) {
            conversation.push({
              role: "assistant",
              content: content || null,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
              })),
            } as ChatCompletionMessageParam);
          } else {
            conversation.push({ role: "assistant", content });
            send({ type: "done" });
            controller.close();
            return;
          }

          // Execute all tool calls in parallel
          const toolResults = await Promise.all(
            toolCalls.map(async (tc) => {
              let result: unknown;
              try {
                result = await executeTool(tc.name, JSON.parse(tc.arguments || "{}"));
              } catch (err) {
                result = { error: String(err) };
              }
              send({ type: "tool_end", name: tc.name });
              return {
                role: "tool" as const,
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              };
            })
          );

          conversation.push(...toolResults);
        }

        send({ type: "error", message: "Max lookup iterations reached. Please rephrase." });
        controller.close();
      } catch (err: unknown) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
