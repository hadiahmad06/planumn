/**
 * Prerequisite checking (A29). The catalog only has prerequisites as text, e.g.
 *   "prereq: [(CSCI 1913 or CSCI 1933) and CSCI 2011] or instr consent or grad standing"
 *   "prereq: 2021 or EE 2361; CS upper div, CompE upper div., or dept. permission"
 * We parse the course codes into an and/or tree. Anything that isn't a course (standing, consent,
 * permission) is "other": we can't check it, so it never blocks, but it's remembered so a warning can
 * say "or other ways to qualify".
 */

export type PrereqNode =
  | { kind: "course"; code: string }
  | { kind: "other"; text: string }
  | { kind: "and" | "or"; children: PrereqNode[] };

/** `own`: the same number under the course's own subject, for a bare number that starts a comma part (see `combineClauses`). */
type Token = { t: "(" | ")" | ";" | "," | "and" | "or" } | { t: "code"; code: string; own?: string } | { t: "word"; text: string };

/** Course nodes read from a bare number that starts a comma part, and the code under the course's own subject. */
const OWN_CODE = new WeakMap<PrereqNode, string>();

const CODE = /^(?:([A-Za-z]{2,5})\s*)?(\d{4}[A-Za-z]{0,2})$/;
/** English words that can sit right before a number ("in 6704", "of 1004") and aren't subject codes. */
const NOT_A_SUBJECT = /^(?:in|of|at|to|by|for|on|or|and|the|than|with|from|above|below|after|before)$/i;
/**
 * A grade minimum before a course: "grade of at least C- in CSCI 1133", "C- or better in SPAN 1003",
 * also with the label left on ("Prereq: grade of … in CSCI 1133"). The course after "in" is read; the
 * grade can't be checked, so it's dropped, like other grade minimums.
 */
const GRADE_THEN_CODE = /\b(?:grade|better|higher)\b[\s\S]*?\bin\s+(\S[\s\S]*)$/i;
/** "C- or better", "C or higher": a grade, not an alternative, so its "or" must not split the text. */
const GRADE_OR_BETTER = /(\b[A-F][+-]?\s+)or\s+(better|higher|above)\b/g;

function tokenize(text: string, defaultDept: string): Token[] {
  const tokens: Token[] = [];
  /** null after "… in 6704": the bare numbers that follow continue that corequisite list ("in 1061, 1071"). */
  let dept: string | null = defaultDept;
  /** "next" right after a comma; true while bare numbers continue a run that started there. */
  let ownRun: "next" | boolean = false;
  const parts = text
    .replace(/[[{]/g, "(")
    .replace(/[\]}]/g, ")")
    .replace(GRADE_OR_BETTER, "$1$2")
    .replace(/\bor\s+better\b/gi, "better")
    .split(/(\(|\)|;|,|\band\b|\bor\b|&)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const [i, part] of parts.entries()) {
    const lower = part.toLowerCase();
    // "MATH [1271 OR 1371]": a department written before a bracketed list applies to the numbers in it.
    if (/^[A-Z]{2,5}$/.test(part) && parts[i + 1] === "(" && lower !== "and" && lower !== "or") {
      dept = part;
      continue;
    }
    if (part === "(" || part === ")" || part === ";" || part === ",") {
      if (part !== ",") dept ??= defaultDept; // a bracket or ";" ends a corequisite list
      ownRun = part === "," ? "next" : false;
      tokens.push({ t: part });
    }
    else if (lower === "and" || part === "&") tokens.push({ t: "and" });
    else if (lower === "or") tokens.push({ t: "or" });
    else {
      // A part may hold several codes separated by "/" or spaces ("CSci 1913/1933").
      const readCodes = (text: string): string[] => {
        const codes: string[] = [];
        for (const piece of text.split(/\s*\/\s*/)) {
          const m = piece.replace(/\.$/, "").match(CODE);
          if (!m) return [];
          // "… concurrent registration is required (or allowed) in 6704": "in" isn't a subject, and the
          // course is a corequisite, kept as text like other corequisites.
          if (m[1] && NOT_A_SUBJECT.test(m[1])) {
            dept = null;
            return [];
          }
          if (m[1]) dept = m[1].toUpperCase();
          if (dept === null) return [];
          bare = !m[1];
          codes.push(`${dept} ${m[2].toUpperCase()}`);
        }
        return codes;
      };
      let bare = false;
      let codes = readCodes(part);
      const graded = codes.length ? null : part.match(GRADE_THEN_CODE);
      if (graded) codes = readCodes(graded[1]);
      // "Math 2243 or Math 2373, 3331": a bare number right after a comma, and the bare numbers after it
      // until a subject is named, may mean the course's own subject (ME 3331); `combineClauses` decides.
      ownRun = codes.length === 1 && bare && ownRun !== false && dept !== defaultDept;
      if (codes.length === 1) tokens.push({ t: "code", code: codes[0], ...(ownRun ? { own: `${defaultDept} ${codes[0].split(" ")[1]}` } : {}) });
      else if (codes.length > 1) {
        tokens.push({ t: "(" });
        codes.forEach((code, i) => {
          if (i) tokens.push({ t: "or" });
          tokens.push({ t: "code", code });
        });
        tokens.push({ t: ")" });
      } else tokens.push({ t: "word", text: part });
    }
  }
  return tokens;
}

/** Simplify: unwrap single-child groups, merge nested groups of the same kind. */
function simplify(node: PrereqNode): PrereqNode {
  if (node.kind !== "and" && node.kind !== "or") return node;
  const children = node.children.map(simplify).flatMap((c) => (c.kind === node.kind ? (c as { children: PrereqNode[] }).children : [c]));
  return children.length === 1 ? children[0] : { kind: node.kind, children };
}

/**
 * Parses an expression at one nesting level. "and" binds tighter than "or". A comma takes the
 * meaning of the next explicit and/or at the same level ("A, B, or C" = A or B or C); default "and".
 */
function parseLevel(tokens: Token[], pos: { i: number }): PrereqNode {
  const items: (PrereqNode | "and" | "or" | "," | ";")[] = [];
  let words: string[] = [];
  const flushWords = () => {
    if (words.length) items.push({ kind: "other", text: words.join(" ") });
    words = [];
  };
  while (pos.i < tokens.length) {
    const tok = tokens[pos.i];
    if (tok.t === ")") {
      pos.i++;
      break;
    }
    pos.i++;
    if (tok.t === "(") {
      flushWords();
      items.push(parseLevel(tokens, pos));
    } else if (tok.t === "code") {
      flushWords();
      const node: PrereqNode = { kind: "course", code: tok.code };
      if (tok.own) OWN_CODE.set(node, tok.own);
      items.push(node);
    } else if (tok.t === "word") words.push(tok.text);
    else if (tok.t === "and" || tok.t === "or" || tok.t === ",") {
      flushWords();
      items.push(tok.t);
    } else if (tok.t === ";") {
      flushWords();
      items.push(";");
    }
  }
  flushWords();

  // ";" separates independent clauses that must all hold: "2021 or EE 2361; CS upper div".
  const segments: Item[][] = [[]];
  for (const it of items) {
    if (it === ";") segments.push([]);
    else segments[segments.length - 1].push(it);
  }
  const parsed = segments.filter((seg) => seg.length).map(combine);
  return parsed.length === 1 ? parsed[0] : { kind: "and", children: parsed };
}

type Item = PrereqNode | "and" | "or" | ",";
const isOp = (x: Item | undefined): x is "and" | "or" => x === "and" || x === "or";

/**
 * Commas are read two ways, as the catalog's own strings use them (data/catalog.db, checked 2026-11-03):
 * - **A list** (the default): "A, B, or C", "A, B or C", "A, B". Each comma takes the next explicit
 *   and/or ("and" if none).
 * - **Clauses:** when a part before a comma has its own "or", the commas separate parts that all hold:
 *   "Math 2243 or Math 2373, 3331" (ME 3332) = (2243 or 2373) and 3331; "Acct 2050 or Acct 2051, SCO 2550
 *   or BA 2551" (FINA 3001H) = (2050 or 2051) and (2550 or 2551). A part that starts with and/or
 *   (", or C") joins with that word instead. `clausesFit` lists the exceptions that keep the list reading.
 */
function combine(items: Item[]): PrereqNode {
  const parts: Item[][] = [[]];
  for (const it of items) {
    if (it === ",") parts.push([]);
    else parts[parts.length - 1].push(it);
  }
  return clausesFit(items, parts) ? combineClauses(parts) : combineList(items);
}

/** An and/or that isn't the first item of its comma part (", or C" starts a part; "A or B" has one inside). */
const inner = (p: Item[], op: "and" | "or") => p.slice(1).includes(op);
const courseIn = (x: Item | undefined): x is { kind: "course"; code: string } => typeof x === "object" && x.kind === "course";
const numberOf = (code: string) => code.split(" ")[1];

/**
 * Whether commas here separate clauses (see `combine`'s doc). Only when a part before the last comma
 * has an "or" inside it, and none of the signs that the list reading is the right one:
 * - the only word used also ends the list ("1272 or 1372, 1572, or 2472", MATH 4065);
 * - the text says "one of" ("BIOL1951 or one of the following: BIOL1001, …", EEB 3412W);
 * - a part before a comma ends in text ending in a bare number after "in"/"of", so the commas continue a
 *   list the text started ("… concurrent registration is required (or allowed) in 8003, 8211, 5032 or
 *   equiv", APEC 8501);
 * - a part that is one course with the same number as a course of another subject in the part before
 *   it: a cross-listing named as an alternative ("ECON 1101 or ECON 1165, APEC 1101", ECON 3951; "1101,
 *   1102 or Econ 1101, 1102", APEC 4311).
 * Each of these was right under the list reading and wrong under clauses (review of #91). A part before
 * the last comma with only "and" inside stays a list ("Biol 1951 and 2003, Biol 1009 or BMEN 2501" =
 * (1951 and 2003) or 1009 or 2501, BIOL 3051).
 */
function clausesFit(items: Item[], parts: Item[][]): boolean {
  if (parts.length < 2) return false;
  const early = parts.slice(0, -1);
  if (!early.some((p) => inner(p, "or"))) return false;
  if (new Set(items.filter(isOp)).size === 1 && parts.slice(1).some((p) => isOp(p[0]))) return false;
  if (items.some((x) => typeof x === "object" && x.kind === "other" && /\bone of\b/i.test(x.text))) return false;
  if (
    early.some((p) => {
      const last = p[p.length - 1];
      return typeof last === "object" && last.kind === "other" && /\b(?:in|of)\s+\d{4}[A-Za-z]{0,2}\s*$/i.test(last.text);
    })
  )
    return false;
  return !parts.some((p, i) => {
    const body = p.filter((x) => !isOp(x));
    const only = body[0];
    if (i === 0 || body.length !== 1 || !courseIn(only)) return false;
    const [subject, number] = only.code.split(" ");
    return parts[i - 1].some((x) => courseIn(x) && numberOf(x.code) === number && !x.code.startsWith(`${subject} `));
  });
}

/**
 * In a clause reading, a part that starts with a bare number names the course's own subject, not the
 * subject before the comma: ME 3332 "Math 2243 or Math 2373, 3331" = (MATH 2243 or MATH 2373) and ME 3331
 * (there is no MATH 3331); IE 3522 "…, 3521 or Stat 3021, …" = IE 3521 or STAT 3021 (#92 review). In a
 * list reading ("CSCI 1913, 1933") the bare number keeps the subject before it.
 */
function combineClauses(parts: Item[][]): PrereqNode {
  let node: PrereqNode | null = null;
  for (const p of parts) {
    const raw = isOp(p[0]) ? p.slice(1) : p;
    const first = raw[0];
    const own = typeof first === "object" && OWN_CODE.has(first);
    const body = own ? raw.map((x): Item => (typeof x === "object" && OWN_CODE.has(x) ? { kind: "course", code: OWN_CODE.get(x)! } : x)) : raw;
    if (!body.some((x) => !isOp(x))) continue;
    const part = combineList(body);
    node = node ? { kind: isOp(p[0]) ? p[0] : "and", children: [node, part] } : part;
  }
  return node ?? { kind: "and", children: [] };
}

function combineList(items: Item[]): PrereqNode {
  // Resolve commas, then split by "or" into groups of "and".
  const ops = items.map((it, i) => {
    if (it !== ",") return it;
    const next = items.slice(i + 1).find((x) => x === "and" || x === "or");
    return (next as "and" | "or" | undefined) ?? "and";
  });
  const orGroups: PrereqNode[][] = [[]];
  for (const it of ops) {
    if (it === "or") orGroups.push([]);
    else if (it !== "and") orGroups[orGroups.length - 1].push(it); // adjacent operands mean "and"
  }
  const groups = orGroups.filter((g) => g.length).map((g): PrereqNode => (g.length === 1 ? g[0] : { kind: "and", children: g }));
  return groups.length === 1 ? groups[0] : { kind: "or", children: groups };
}

/** Pull the prerequisite clause out of a catalog description (null if there is none). */
export function extractPrereqText(description: string | null | undefined): string | null {
  if (!description) return null;
  const m = description.match(/\bpre-?req(?:uisites?|s)?\s*:\s*([\s\S]+)$/i);
  return m ? m[1].trim() : null;
}

/** "Credit will not be granted if …", "Credit granted for only one of …": courses that block credit. */
const ANTI_REQUISITE = /\bcredit (?:will not be granted|(?:is |will be )?granted for only one of)\b/i;

export function parsePrereqs(text: string, ownDept: string): PrereqNode | null {
  // "Credit will not be granted if credit has been received for: …" and "Credit granted for only one of
  // the following: …" list courses that *block* credit (12 catalog strings; MICB 3303 and EEB 3412W list
  // themselves), not prerequisites.
  const tokens = tokenize(text.split(ANTI_REQUISITE)[0], ownDept.toUpperCase());
  if (!tokens.some((t) => t.t === "code")) return null;
  return simplify(parseLevel(tokens, { i: 0 }));
}

export interface PrereqCheck {
  met: boolean;
  /** Unmet course requirements, readable: "CSCI 1933 and CSCI 2011". Empty when met. */
  missing: string;
  /** The text also lists non-course ways to qualify (consent, standing), so this may not block. */
  hasOtherPaths: boolean;
}

/** `taken(code)` = the course is planned in an earlier semester. */
export function checkPrereqs(node: PrereqNode, taken: (code: string) => boolean): PrereqCheck {
  let hasOtherPaths = false;
  // null = can't check (non-course clause)
  const evaluate = (n: PrereqNode): boolean | null => {
    if (n.kind === "course") return taken(n.code);
    if (n.kind === "other") return null;
    const vals = n.children.map(evaluate);
    if (n.kind === "and") return vals.every((v) => v !== false);
    if (vals.some((v) => v === true)) return true;
    if (vals.every((v) => v === null)) return null;
    if (vals.some((v) => v === null)) hasOtherPaths = true;
    return false;
  };
  const describe = (n: PrereqNode): string | null => {
    if (n.kind === "course") return taken(n.code) ? null : n.code;
    if (n.kind === "other") return null;
    if (n.kind === "and") {
      const parts = n.children.filter((c) => evaluate(c) === false).map(describe).filter(Boolean) as string[];
      return parts.length ? parts.map((p) => (parts.length > 1 && p.includes(" or ") ? `(${p})` : p)).join(" and ") : null;
    }
    const parts = n.children.filter((c) => c.kind !== "other").map(describe).filter(Boolean) as string[];
    return parts.length ? parts.map((p) => (parts.length > 1 && p.includes(" and ") ? `(${p})` : p)).join(" or ") : null;
  };
  const result = evaluate(node);
  const met = result !== false;
  return { met, missing: met ? "" : (describe(node) ?? ""), hasOtherPaths: !met && hasOtherPaths };
}
