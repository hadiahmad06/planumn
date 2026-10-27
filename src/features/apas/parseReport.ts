import {
  apasOption,
  classifyApasCourse,
  parseApasCourseCode,
  parseApasTerm,
  parseApasTermLabel,
  parseUachieveTerm,
  type ApasAudit,
  type ApasCourse,
  type ApasNeeds,
  type ApasRequirement,
  type ApasStatus,
  type ApasSubrequirement,
} from "@/domain/apas";

/**
 * Parse a captured UMN APAS audit page (uAchieve Self-Service "Audit Results", HTML format) into an
 * `ApasAudit` (B1 step 2). Written by Hadi's Claude from two real reports.
 *
 * The page holds the audit twice (a mobile copy and the desktop `#selectedAudit`); only one is read.
 * Returns null when the page isn't an audit (a menu, the run page, the list of audits).
 */
export function parseApasReport(doc: Document): ApasAudit | null {
  const audit = doc.querySelector("#selectedAudit #audit") ?? doc.querySelector("#audit");
  if (!audit) return null;

  const header = headerFields(doc);
  const program = {
    code: audit.getAttribute("dprog")?.trim() || header.get("program code") || "",
    title: text(doc.querySelector(".card-header h2")) || "",
  };
  const catalogTerm = parseUachieveTerm(audit.getAttribute("catlyt") ?? "") ?? parseApasTermLabel(header.get("catalog year") ?? "");
  const grad = header.get("expected grad term");

  const requirements = [...audit.querySelectorAll(".requirement")].map(requirement);

  return {
    program,
    catalogTerm,
    preparedOn: header.get("prepared on") ?? null,
    expectedGradTerm: grad ? parseApasTermLabel(grad) : null,
    complete: !audit.querySelector(".completionTextNO") && Boolean(audit.querySelector("[class^='completionText']")),
    courses: markNoCredit(dedupe([...audit.querySelectorAll("tr.takenCourse")].flatMap((tr) => course(tr) ?? [])), requirements),
    requirements,
  };
}

/**
 * APAS lists withdrawn, failed, repeated and non-transferable rows (e.g. the "NOTR 0T001" placeholder
 * for an AP score with no UMN equivalent) under "Courses That Do Not Earn Credit…". Trust that list
 * over our own grade rules: those rows earn no credit.
 */
function markNoCredit(courses: ApasCourse[], requirements: ApasRequirement[]): ApasCourse[] {
  const none = new Set(
    requirements.filter((r) => /do not earn credit/i.test(r.title)).flatMap((r) => r.subrequirements.flatMap((s) => s.courses)),
  );
  return courses.map((c) =>
    none.has(c.code) && c.kind !== "in-progress" && c.kind !== "planned"
      ? { ...c, earnedCredit: false, kind: c.kind === "withdrawn" ? "withdrawn" : "no-credit" }
      : c,
  );
}

/** Parse captured HTML in the browser. */
export function parseApasHtml(html: string): ApasAudit | null {
  return parseApasReport(new DOMParser().parseFromString(html, "text/html"));
}

function text(el: Element | null | undefined): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Title text with <br> as spaces. */
function lines(el: Element | null | undefined): string {
  if (!el) return "";
  const copy = el.cloneNode(true) as Element;
  copy.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
  return text(copy);
}

/** "Prepared On", "Catalog Year", "Expected Grad Term" (and the run-info table's "Program Code"). */
function headerFields(doc: Document): Map<string, string> {
  const out = new Map<string, string>();
  for (const b of doc.querySelectorAll(".card-header b")) {
    const parts = (b.innerHTML ?? "").split(/<br\s*\/?>/i).map((p) => p.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    if (parts.length >= 2 && parts[0]) out.set(parts[0].toLowerCase(), parts[1]);
  }
  const info = doc.querySelector("#auditRunInfo table");
  if (info) {
    const heads = [...info.querySelectorAll("th")].map((th) => text(th).toLowerCase());
    const cells = [...info.querySelectorAll("tbody td")].map((td) => text(td));
    // The student ID column is deliberately not read.
    heads.forEach((h, i) => h === "program code" && cells[i] && out.set(h, cells[i]));
  }
  return out;
}

function status(el: Element | null): ApasStatus {
  const cls = el?.className ?? "";
  if (/Status_OK|statusOK/.test(cls)) return "complete";
  if (/Status_IP|statusIP/.test(cls)) return "in-progress";
  if (/Status_NO\b|statusNO\b/.test(cls)) return "incomplete";
  return "none";
}

const num = (el: Element | null) => {
  const n = Number.parseFloat(text(el));
  return Number.isFinite(n) ? n : null;
};

function totals(row: Element | null) {
  return { credits: num(row?.querySelector(".hours") ?? null), courses: num(row?.querySelector(".count") ?? null) };
}

/**
 * A "Needs:" row. Requirement totals put numbers in spans (`.hours`, `.count`) inside one cell;
 * sub-requirements use cells. Either way a count's label says "course(s)" or "group(s)".
 */
function needs(row: Element | null): ApasNeeds | null {
  if (!row) return null;
  const count = num(row.querySelector(".count"));
  const countLabel = text(row.querySelector(".countlabel")).toLowerCase();
  const out: ApasNeeds = {
    credits: num(row.querySelector(".hours")),
    courses: countLabel.startsWith("group") ? null : count,
    groups: countLabel.startsWith("group") ? count : null,
    subrequirements: num(row.querySelector(".subreqs")),
  };
  return Object.values(out).some((v) => v != null) ? out : null;
}

function course(tr: Element): ApasCourse | null {
  const cell = (c: string) => text(tr.querySelector(`:scope > td.${c}`));
  const parsed = parseApasCourseCode(tr.querySelector(":scope > td.course")?.textContent ?? "");
  if (!parsed) return null;
  const descLines = [...tr.querySelectorAll("td.description .descLine")].map(text).filter(Boolean);
  const credits = Number.parseFloat(cell("credit")) || 0;
  const grade = cell("grade");
  const condition = cell("ccode");
  const termRaw = cell("term");
  return {
    term: parseApasTerm(termRaw),
    termRaw,
    ...parsed,
    credits,
    grade,
    condition,
    ...classifyApasCourse({ grade, condition, credits, notes: descLines.slice(1) }),
    title: descLines[0] ?? "",
    notes: descLines.slice(1),
  };
}

function dedupe(courses: ApasCourse[]): ApasCourse[] {
  const seen = new Map<string, ApasCourse>();
  for (const c of courses) {
    const key = `${c.termRaw}|${c.code}|${c.grade}|${c.condition}`;
    if (!seen.has(key)) seen.set(key, c);
  }
  return [...seen.values()];
}

function subrequirement(el: Element): ApasSubrequirement {
  const options = [...el.querySelectorAll(".selectcourses .course")]
    .map((s) => apasOption(s.getAttribute("department") ?? "", s.getAttribute("number") ?? ""))
    .filter((o): o is string => o != null);
  return {
    title: lines(el.querySelector(".subreqTitle")),
    status: status(el.querySelector(".subreqPretext .status")),
    required: text(el.querySelector(".subreqRequired")) === "R",
    needs: needs(el.querySelector(".subreqNeeds tr")),
    courses: [...new Set([...el.querySelectorAll("tr.takenCourse")].flatMap((tr) => parseApasCourseCode(tr.querySelector("td.course")?.textContent ?? "")?.code ?? []))],
    options: [...new Set(options)],
  };
}

function requirement(el: Element): ApasRequirement {
  const title = text(el.querySelector(".reqTitle h4, .reqHeader h3")) || text(el.querySelector(".reqHeaderTable h3.sr-only")).replace(/^Requirement:\s*/, "");
  return {
    id: el.getAttribute("rname")?.trim() ?? "",
    title,
    status: status(el),
    earned: totals(el.querySelector(".requirementTotals .reqEarned")),
    inProgress: totals(el.querySelector(".requirementTotals .reqIpDetail")),
    needs: needs(el.querySelector(".requirementTotals .reqNeeds")),
    subrequirements: [...el.querySelectorAll(".subrequirement")].map(subrequirement),
  };
}
