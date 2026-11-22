import { card, COURSES, expect, freshTerms, label, openSeeded, PROGRAM, seededPlan, semester, test } from "./fixtures";

/** A3 smoke test, mobile viewport (Hadi's Claude, 2026-11-22). Runs in the "mobile" project (Pixel 7). */

const [fall, spring] = freshTerms();

test("mobile: the rail section and the schedule render", async ({ stubbed: page }) => {
  await openSeeded(page, seededPlan({ [fall]: [COURSES.csci2041.id] }));

  // No side rail below 768px; requirements are a collapsible section above the schedule.
  await expect(page.getByRole("complementary")).toHaveCount(0);
  const toggle = page.getByRole("button", { name: /^Requirements/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: PROGRAM.name })).toBeVisible();
  await expect(page.getByText("Lower division core")).toBeVisible();

  // Schedule: one column per year row, with the seeded course and an empty semester.
  await expect(semester(page, fall)).toBeVisible();
  await expect(card(page, fall, COURSES.csci2041)).toBeVisible();
  await expect(semester(page, spring).getByText("Add from search or Requirements")).toBeVisible();
  await expect(page.getByRole("button", { name: `Select ${label(spring)}: + and Enter add courses here` })).toBeVisible();
});
