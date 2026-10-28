import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

// extension/src/automation.js is plain browser JS (a global), loaded the way content scripts load it.
interface Auto {
  pageKind(pathname: string, hasAudit: boolean): string;
  auditId(href: string | null): string | null;
  isDegreeProgram(code: string): boolean;
  pickNewAudit(rows: { id: string | null; program: string }[], baseline: string[]): { id: string | null; program: string } | null;
}
const ctx: { PLANUMN_AUTO?: Auto } = {};
runInNewContext(readFileSync(path.resolve(__dirname, "../../../extension/src/automation.js"), "utf8"), ctx);
const auto = ctx.PLANUMN_AUTO!;

describe("APAS audit automation helpers (extension/src/automation.js)", () => {
  it("knows the APAS pages", () => {
    expect(auto.pageKind("/selfservice/audit/create.html", false)).toBe("create");
    expect(auto.pageKind("/selfservice/audit/list.html", false)).toBe("list");
    expect(auto.pageKind("/selfservice/audit/read.html", true)).toBe("audit");
    expect(auto.pageKind("/selfservice/general/home.html", false)).toBe("other");
  });

  it("reads audit ids from list links", () => {
    expect(auto.auditId("read.html?id=JobQueueRun!!!!AAAA=")).toBe("JobQueueRun!!!!AAAA=");
    expect(auto.auditId("https://umn.uachieve.com/selfservice/audit/read.html?x=1&id=B%3D#top")).toBe("B=");
    expect(auto.auditId("list.html")).toBeNull();
  });

  it("tells degree programs from honors, lower-division and course checks", () => {
    expect(auto.isDegreeProgram("1019600271")).toBe(true);
    expect(auto.isDegreeProgram("1230100000")).toBe(false);
    expect(auto.isDegreeProgram("1050307000")).toBe(false);
    expect(auto.isDegreeProgram("LECHECK")).toBe(false);
  });

  it("picks a new audit, preferring a degree program, newest first", () => {
    const rows = [
      { id: "h2", program: "1230100000" },
      { id: "ee", program: "1026400217" },
      { id: "cs", program: "1019600271" },
      { id: "old", program: "1019600271" },
    ];
    expect(auto.pickNewAudit(rows, ["old"])).toEqual({ id: "ee", program: "1026400217" });
    expect(auto.pickNewAudit(rows.slice(0, 1).concat(rows.slice(3)), ["old"])).toEqual({ id: "h2", program: "1230100000" });
    expect(auto.pickNewAudit(rows.slice(3), ["old"])).toBeNull();
  });
});
