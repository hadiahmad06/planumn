"use client";

import { useId, useState, type PointerEvent } from "react";
import type { GradeCounts } from "@/domain/course";
import { averageGpa } from "@/domain/workload";
import { cn } from "@/components/ui/cn";

/**
 * Compact grade charts from the 2025 preview card, redrawn by Hadi's Claude: an area chart of letter
 * grades (F → A, with the average GPA) beside a small bar chart of S / N / W. Hover or focus shows the
 * exact share. Each chart has a visually hidden table with the same numbers.
 */
const LETTERS = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
const OTHER = ["S", "P", "N", "W"];
/** 2025 rule: a W share above 7.5% is worth flagging. */
const HIGH_W = 0.075;

const W = 300;
const H = 48;
const LABEL = 12;

function pct(n: number, total: number) {
  return total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";
}

export function LetterGradeChart({ grades, className }: { grades: GradeCounts; className?: string }) {
  const letters = LETTERS.filter((g) => g !== "A+" || (grades["A+"] ?? 0) > 0);
  const counts = letters.map((g) => grades[g] ?? 0);
  const total = counts.reduce((a, b) => a + b, 0);
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();
  if (total === 0) return <p className={cn("text-micro text-text-tertiary italic", className)}>No letter grades recorded.</p>;

  const max = Math.max(...counts);
  const x = (i: number) => (W * i) / (letters.length - 1);
  const y = (n: number) => H - (n / max) * (H - 4);
  const line = counts.map((n, i) => `${x(i)},${y(n)}`).join(" ");
  const gpa = averageGpa(grades);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (letters.length - 1));
    setHover(Math.max(0, Math.min(letters.length - 1, i)));
  };

  return (
    <figure className={cn("relative min-w-0", className)}>
      <figcaption id={titleId} className="mb-0.5 flex items-baseline justify-between gap-2 text-micro text-text-secondary">
        <span>{hover === null ? `${total.toLocaleString()} letter grades` : `${letters[hover]}: ${pct(counts[hover], total)} (${counts[hover].toLocaleString()})`}</span>
        {gpa !== null && (
          <span className="shrink-0">
            avg GPA <span className="font-semibold text-text-primary tabular-nums">{gpa.toFixed(2)}</span>
          </span>
        )}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H + LABEL}`}
        className="block h-14 w-full overflow-visible"
        aria-hidden
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <polygon points={`0,${H} ${line} ${W},${H}`} className="fill-accent/15" />
        <polyline points={line} fill="none" strokeWidth={1.5} strokeLinejoin="round" className="stroke-accent" />
        <line x1={0} y1={H} x2={W} y2={H} strokeWidth={1} className="stroke-border" />
        {hover !== null && (
          <>
            <line x1={x(hover)} y1={0} x2={x(hover)} y2={H} strokeWidth={1} className="stroke-text-tertiary" />
            <circle cx={x(hover)} cy={y(counts[hover])} r={3} className="fill-accent" />
          </>
        )}
        {letters.map((g, i) =>
          g.length === 1 ? (
            <text key={g} x={x(i)} y={H + LABEL - 1} textAnchor={i === 0 ? "start" : i === letters.length - 1 ? "end" : "middle"} className="fill-text-tertiary text-[10px]">
              {g}
            </text>
          ) : null,
        )}
      </svg>
      <div className="sr-only">
        <table aria-labelledby={titleId}>
        <tbody>
          {letters.map((g, i) => (
            <tr key={g}>
              <th scope="row">{g}</th>
              <td>{pct(counts[i], total)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </figure>
  );
}

export function OtherGradeChart({ grades, className }: { grades: GradeCounts; className?: string }) {
  const shown = OTHER.filter((g) => g !== "P" || (grades.P ?? 0) > 0);
  const all = Object.values(grades).reduce((a, b) => a + (b > 0 ? b : 0), 0);
  const [hover, setHover] = useState<number | null>(null);
  if (all === 0) return null;
  const counts = shown.map((g) => grades[g] ?? 0);
  // Same scale as every grade (2025), so a small W share looks small next to the letter grades.
  const max = Math.max(...Object.values(grades), 1);
  const bw = 72 / shown.length;
  const highW = (grades.W ?? 0) / all > HIGH_W;

  return (
    <figure className={cn("relative shrink-0", className)}>
      <figcaption className="mb-0.5 text-micro whitespace-nowrap text-text-secondary">
        {hover === null ? (highW ? <span className="text-danger">W {pct(grades.W ?? 0, all)}</span> : "S / N / W") : `${shown[hover]}: ${pct(counts[hover], all)}`}
      </figcaption>
      <svg viewBox={`0 0 72 ${H + LABEL}`} className="block h-14 w-[72px]" aria-hidden onPointerLeave={() => setHover(null)}>
        {shown.map((g, i) => {
          const h = (counts[i] / max) * (H - 4);
          return (
            <g key={g} onPointerEnter={() => setHover(i)}>
              <rect x={i * bw} y={0} width={bw} height={H} className="fill-transparent" />
              <rect
                x={i * bw + 2}
                y={H - h}
                width={bw - 4}
                height={h}
                rx={1.5}
                className={cn(g === "W" && highW ? "fill-danger" : "fill-text-secondary", hover === i ? "opacity-70" : "opacity-35")}
              />
              <text x={i * bw + bw / 2} y={H + LABEL - 1} textAnchor="middle" className="fill-text-tertiary text-[10px]">
                {g}
              </text>
            </g>
          );
        })}
        <line x1={0} y1={H} x2={72} y2={H} strokeWidth={1} className="stroke-border" />
      </svg>
      <div className="sr-only">
        <table>
        <caption>Other grades</caption>
        <tbody>
          {shown.map((g, i) => (
            <tr key={g}>
              <th scope="row">{g}</th>
              <td>{pct(counts[i], all)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </figure>
  );
}
