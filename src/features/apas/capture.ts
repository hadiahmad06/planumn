import type { ApasReport } from "./protocol";

/**
 * Helpers for checking and saving a captured APAS page (B1). Written by Hadi's Claude.
 * The checks are quick signals that the capture is the report you meant, not a parse: they only look
 * for things a report should contain and things that mean part of it was missed.
 */

/** "apas-report-2026-10-27.html", from the capture time (local date). */
export function reportFileName(report: Pick<ApasReport, "capturedAt">, now = new Date()): string {
  const d = report.capturedAt ? new Date(report.capturedAt) : now;
  const day = Number.isNaN(d.getTime()) ? now : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `apas-report-${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}.html`;
}

export interface CaptureChecks {
  bytes: number;
  /** Distinct course-code-like strings ("CSCI 2041", "MATH1271H") in the page's text. */
  courseCodes: number;
  /** <iframe>/<frame> elements: their content isn't part of the captured page. */
  frames: number;
}

/**
 * Course code shape: 2–4 capital letters, up to 3 spaces, 4 digits, optional suffix letter. Also
 * uAchieve's own cells, which prefix a campus digit and pad the subject ("1CSCI1001", "1EE  3101";
 * review fix from Michael's Codex on #70).
 */
const COURSE_CODE = /(?<![A-Z0-9])\d?([A-Z]{2,4}) {0,3}(\d{4})[A-Z]?\b/g;

export function captureChecks(html: string): CaptureChecks {
  const text = html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const codes = new Set<string>();
  for (const m of text.matchAll(COURSE_CODE)) codes.add(`${m[1]} ${m[2]}`);
  return {
    bytes: new Blob([html]).size,
    courseCodes: codes.size,
    frames: (html.match(/<i?frame\b/gi) ?? []).length,
  };
}

/** Save the captured page as a file in the student's Downloads. Nothing is uploaded. */
export function downloadReport(report: ApasReport): void {
  const url = URL.createObjectURL(new Blob([report.html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = reportFileName(report);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
