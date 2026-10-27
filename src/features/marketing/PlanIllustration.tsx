/** Written by Michael's Codex. Real course examples, explicitly an illustration. */
export function PlanIllustration() {
  const terms = [
    {
      name: "Fall",
      credits: 12,
      courses: [
        ["CSCI 1133", "Intro to Computing", "4 credits"],
        ["MATH 1271", "Calculus I", "4 credits"],
        ["WRIT 1301", "University Writing", "4 credits"],
      ],
    },
    {
      name: "Spring",
      credits: 12,
      courses: [
        ["CSCI 1933", "Intro to Algorithms", "4 credits"],
        ["MATH 1272", "Calculus II", "4 credits"],
        ["CSCI 2011", "Discrete Structures", "4 credits"],
      ],
    },
  ];
  return (
    <figure
      aria-label="Illustration of a two-semester plan"
      className="relative rounded-modal border border-border-strong bg-surface p-5 shadow-card sm:p-7"
    >
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs text-text-secondary">Example plan</p>
          <h2 className="mt-1 text-xl font-semibold">First year, in focus.</h2>
        </div>
        <span className="rounded-full bg-success-soft px-3 py-1 text-xs text-success">
          24 credits
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {terms.map((term) => (
          <section key={term.name}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">{term.name}</h3>
              <span className="text-xs text-text-secondary">
                {term.credits} credits
              </span>
            </div>
            <div className="space-y-3">
              {term.courses.map(([code, title, credits], i) => (
                <div
                  key={code}
                  className="min-h-28 rounded-row border border-border border-l-4 bg-canvas/40 p-3"
                  style={{ borderLeftColor: `var(--stripe-${i + 1})` }}
                >
                  <p className="text-xs font-semibold text-accent">{code}</p>
                  <p className="mt-1 text-sm font-medium leading-snug">
                    {title}
                  </p>
                  <p className="mt-3 text-xs text-text-secondary">{credits}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <figcaption className="mt-5 text-xs leading-relaxed text-text-secondary">
        An illustration, not a recommended course sequence. Build your own plan
        and review it with your advisor.
      </figcaption>
    </figure>
  );
}
