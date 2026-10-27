import type { CourseId } from "./course";
import { evaluateProgram, type PlannedForAudit, type Program } from "./requirements";

/**
 * Minor finder (Phase B: B14). Written by Ishaan's Claude.
 * Ranks minors by how many of the plan's courses already count toward them ("2 courses toward a Math
 * minor"), using the same evaluator as the rail. A course counts when it fills a choice in any of the
 * minor's requirements. It's a planning hint: whether a course may count toward both a major and a minor
 * is the college's rule, so the UI says to confirm with an advisor.
 */
export interface MinorFit {
  id: string;
  name: string;
  /** Planned courses that count toward the minor. */
  matched: CourseId[];
  /** Requirements fully met / requirements that count (same units as the rail's progress). */
  filled: number;
  units: number;
}

export function rankMinors(programs: Program[], planned: PlannedForAudit[], exclude: ReadonlySet<string> = new Set()): MinorFit[] {
  const fits: MinorFit[] = [];
  for (const program of programs) {
    if (exclude.has(program.id)) continue;
    const result = evaluateProgram(program, planned);
    const matched = [...new Set(result.requirements.flatMap((r) => r.courseIds))];
    if (matched.length === 0) continue;
    fits.push({ id: program.id, name: program.name, matched, filled: result.filled, units: result.units });
  }
  const share = (f: MinorFit) => (f.units > 0 ? f.filled / f.units : 0);
  return fits.sort((a, b) => b.matched.length - a.matched.length || share(b) - share(a) || a.name.localeCompare(b.name));
}
