import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/server/catalog-changes/snapshot", () => ({ catalogCheck: vi.fn() }));
import { catalogCheck } from "@/server/catalog-changes/snapshot";
import { POST } from "./route";
const request = (body: unknown, origin = "https://planu.mn") =>
  new Request("https://planu.mn/api/catalog-check", {
    method: "POST",
    headers: { origin },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(catalogCheck).mockResolvedValue({
    items: [],
    unavailable: [],
    checkedAt: "2026-10-28T00:00:00Z",
  });
});
it("rejects foreign origins, non-public fields, malformed ids and oversized batches before source reads", async () => {
  expect(
    (
      await POST(
        request({ courseIds: [], programIds: [] }, "https://example.com"),
      )
    ).status,
  ).toBe(403);
  for (const body of [
    null,
    { courseIds: [-1], programIds: [] },
    { courseIds: [], programIds: ["../x"] },
    { courseIds: [], programIds: Array(6).fill("P") },
    { courseIds: Array(201).fill(77), programIds: [] },
    { courseIds: [], programIds: [], plan: { title: "private" } },
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(catalogCheck).not.toHaveBeenCalled();
});
it("deduplicates bounded public IDs and returns private/no-store responses", async () => {
  const response = await POST(
    request({ courseIds: [77, 77], programIds: ["P", "P"] }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(catalogCheck).toHaveBeenCalledWith([77], ["P"]);
});
it("rejects invalid JSON and preserves source failures as retryable errors", async () => {
  const malformed = new Request("https://planu.mn/api/catalog-check", {
    method: "POST",
    headers: { origin: "https://planu.mn" },
    body: "{bad",
  });
  expect((await POST(malformed)).status).toBe(400);
  vi.mocked(catalogCheck).mockRejectedValue(
    new Error("private internal details"),
  );
  const response = await POST(request({ courseIds: [77], programIds: [] }));
  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain(
    "private internal details",
  );
});
