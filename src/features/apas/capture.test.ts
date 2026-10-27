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

  it("flags frames, whose content the capture misses", () => {
    expect(captureChecks('<frameset><frame src="a"></frameset><iframe src="b"></iframe>').frames).toBe(2);
  });

  it("measures size in bytes", () => {
    expect(captureChecks("é").bytes).toBe(2);
  });
});
