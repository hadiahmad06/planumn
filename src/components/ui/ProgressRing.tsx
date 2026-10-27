/** Small circular progress indicator. Full = success color with a check. */
export function ProgressRing({ value, total, size = 20 }: { value: number; total: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(value / total, 1) : 0;
  const done = total > 0 && value >= total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill={done ? "var(--success)" : "none"} stroke={done ? "var(--success)" : "var(--border-strong)"} strokeWidth={2} />
      {!done && frac > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray={`${c * frac} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      {done && <path d={`M${size * 0.3} ${size * 0.52} l${size * 0.14} ${size * 0.14} l${size * 0.26} -${size * 0.3}`} fill="none" stroke="var(--bg-surface)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
