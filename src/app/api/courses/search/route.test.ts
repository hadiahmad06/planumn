import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { parseLimit } from "./limit";
import { GET } from "./route";

const get = (qs: string) => GET(new NextRequest(`http://localhost/api/courses/search?${qs}`));

describe("GET /api/courses/search", () => {
  it("parses limit: default 50, clamped to 1–100, rejects non-integers", () => {
    expect(parseLimit(null)).toBe(50);
    expect(parseLimit("20")).toBe(20);
    expect(parseLimit("-1")).toBe(1);
    expect(parseLimit("0")).toBe(1);
    expect(parseLimit("500")).toBe(100);
    expect(parseLimit("1.5")).toBeNull();
    expect(parseLimit("abc")).toBeNull();
  });

  it("never returns more than 100 results (regression: limit=-1 returned 975)", async () => {
    const res = await get("q=1&limit=-1");
    expect(res.status).toBe(200);
    expect((await res.json()).length).toBe(1);
    expect((await (await get("q=1&limit=100000")).json()).length).toBe(100);
  });

  it("returns 400 for a fractional limit (regression: limit=1.5 was a 500)", async () => {
    const res = await get("q=1&limit=1.5");
    expect(res.status).toBe(400);
  });
});
