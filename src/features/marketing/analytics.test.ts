import { describe, expect, it } from "vitest";
import { analyticsUrl } from "./analytics";
describe("analytics privacy", () => {
  it("removes plan identifiers, auth codes, query strings and fragments", () => {
    expect(
      analyticsUrl(
        "https://planu.mn/plan/private-id?email=test@example.com#course",
      ),
    ).toBe("https://planu.mn/plan/saved");
    expect(analyticsUrl("https://planu.mn/auth/callback?code=secret")).toBe(
      "https://planu.mn/auth/callback",
    );
  });
  it("preserves public planning routes", () => {
    expect(analyticsUrl("https://planu.mn/plan/import?source=home")).toBe(
      "https://planu.mn/plan/import",
    );
    // Ishaan's Claude: the APAS import page is public too, not a saved plan.
    expect(analyticsUrl("https://planu.mn/plan/apas")).toBe(
      "https://planu.mn/plan/apas",
    );
  });
});
