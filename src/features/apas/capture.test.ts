import { describe, expect, it } from "vitest";
import { captureChecks, reportFileName } from "./capture";

describe("APAS capture helpers", () => {
  it("names the file after the capture date", () => {
    const local = new Date(2026, 9, 27, 14, 5).toISOString();
    expect(reportFileName({ capturedAt: local })).toBe("apas-report-2026-10-27.html");
    expect(reportFileName({ capturedAt: "not a date" }, new Date(2026, 0, 5))).toBe("apas-report-2026-01-05.html");
  });

  it("counts distinct course codes in the page text, not in scripts, styles or tags", () => {
    const html = `<html><head><style>.CSCI1111{}</style><script>var x = "MATH 9999";</script></head>
      <body data-x="PHYS 1301"><td>CSCI 2041</td><td>CSCI2041</td><td>MATH 1271H</td><td>WRIT 1301</td><td>2026 FALL</td></body></html>`;
    expect(captureChecks(html)).toMatchObject({ courseCodes: 3, frames: 0 });
  });

  it("counts uAchieve's campus-prefixed, padded course cells (review fix, #70)", () => {
    expect(captureChecks("<td>1CSCI1001</td><td>1EE  3101</td><td>1MATH1271H</td><td>1POL 1001</td>").courseCodes).toBe(4);
    expect(captureChecks("<td>21CSCI1001</td>").courseCodes).toBe(0);
  });

  it("flags frames, whose content the capture misses", () => {
    expect(captureChecks('<frameset><frame src="a"></frameset><iframe src="b"></iframe>').frames).toBe(2);
  });

  it("measures size in bytes", () => {
    expect(captureChecks("é").bytes).toBe(2);
  });
});
