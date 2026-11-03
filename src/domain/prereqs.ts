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

type Token = { t: "(" | ")" | ";" | "," | "and" | "or" } | { t: "code"; code: string } | { t: "word"; text: string };

const CODE = /^(?:([A-Za-z]{2,5})\s*)?(\d{4}[A-Za-z]{0,2})$/;

function tokenize(text: string, defaultDept: string): Token[] {
  const tokens: Token[] = [];
  let dept = defaultDept;
  const parts = text
    .replace(/[[{]/g, "(")
    .replace(/[\]}]/g, ")")
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
    if (part === "(" || part === ")" || part === ";" || part === ",") tokens.push({ t: part });
    else if (lower === "and" || part === "&") tokens.push({ t: "and" });
    else if (lower === "or") tokens.push({ t: "or" });
    else {
      // A part may hold several codes separated by "/" or spaces ("CSci 1913/1933").
      const pieces = part.split(/\s*\/\s*/);
      const codes: string[] = [];
      for (const piece of pieces) {
        const m = piece.replace(/\.$/, "").match(CODE);
        if (!m) {
          codes.length = 0;
          break;
        }
        if (m[1]) dept = m[1].toUpperCase();
        codes.push(`${dept} ${m[2].toUpperCase()}`);
      }
      if (codes.length === 1) tokens.push({ t: "code", code: codes[0] });
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
      items.push({ kind: "course", code: tok.code });
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
  const segments: (PrereqNode | "and" | "or" | ",")[][] = [[]];
  for (const it of items) {
    if (it === ";") segments.push([]);
    else segments[segments.length - 1].push(it);
  }
  const parsed = segments.filter((seg) => seg.length).map(combine);
  return parsed.length === 1 ? parsed[0] : { kind: "and", children: parsed };
}

function combine(items: (PrereqNode | "and" | "or" | ",")[]): PrereqNode {
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

export function parsePrereqs(text: string, ownDept: string): PrereqNode | null {
  const tokens = tokenize(text, ownDept.toUpperCase());
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
