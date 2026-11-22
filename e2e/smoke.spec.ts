import { AUTOSAVE_KEY } from "../src/features/plans/localRepository";
import { card, COURSES, expect, freshTerms, label, openSeeded, PROGRAM, seededPlan, semester, test } from "./fixtures";

/**
 * A3 smoke tests, desktop (Hadi's Claude, 2026-11-22): the main signed-out flows of issue #101.
 * Every test starts from an empty browser (fresh context), so they run in any order.
 */

const [fall, spring] = freshTerms();
/** The fall a year after the plan's first one (Fall → Spring → Summer → Fall). */
const nextFall = freshTerms()[3];

test("home → new plan → pick a program → the requirements rail renders", async ({ stubbed: page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start a plan" }).click();
  await expect(page).toHaveURL(/\/plan\/new$/);

  const rail = page.getByRole("complementary");
  await expect(rail.getByText("Add a major or minor to see its requirements")).toBeVisible();
  await rail.getByRole("button", { name: "Add your major or minor" }).click();
  await page.getByRole("textbox", { name: "Search programs" }).fill("Computer Science B.S.");
  await page.getByRole("button", { name: PROGRAM.name, exact: true }).click();

  await expect(rail.getByRole("heading", { name: PROGRAM.name })).toBeVisible();
  await expect(rail.getByText("Lower division core")).toBeVisible();
  await expect(rail.getByRole("button", { name: `Remove ${PROGRAM.name}` })).toBeVisible();
});

test("search a course, then add it by drag and drop and with + on the selected semester", async ({ stubbed: page }) => {
  await page.goto("/plan/new");
  const search = page.getByRole("combobox", { name: "Search courses" });

  // Drag and drop: search result → Fall semester.
  await search.fill(COURSES.csci2041.code);
  const result = page.getByRole("option").filter({ hasText: COURSES.csci2041.title });
  await expect(result).toBeVisible();
  const from = (await result.boundingBox())!;
  const to = (await semester(page, fall).boundingBox())!;
  await page.mouse.move(from.x + 40, from.y + from.height / 2);
  await page.mouse.down();
  // Past dnd-kit's 5px activation distance, then onto the semester (below the dropdown).
  await page.mouse.move(from.x + 60, from.y + from.height / 2 + 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height - 20, { steps: 15 });
  await expect(semester(page, fall)).toHaveClass(/border-accent/);
  await page.mouse.up();
  await expect(card(page, fall, COURSES.csci2041)).toBeVisible();

  // "+": select Spring, search, press + on the result.
  await page.getByRole("button", { name: `Select ${label(spring)}: + and Enter add courses here` }).click();
  await search.fill(COURSES.csci1933.code);
  await page.getByRole("button", { name: `Add ${COURSES.csci1933.code} to ${label(spring)}`, exact: true }).click();
  await expect(card(page, spring, COURSES.csci1933)).toBeVisible();
  await expect(page.getByText("2 courses", { exact: true })).toBeVisible();
});

test("‹ › arrows snap a course to the next term it is offered", async ({ stubbed: page }) => {
  await openSeeded(page, seededPlan({ [fall]: [COURSES.csci2041.id] }));
  const code = COURSES.csci2041.code;

  // CSCI 2041 is fall-only (pinned in fixtures), so › skips Spring and Summer.
  await card(page, fall, COURSES.csci2041).hover();
  const later = page.getByRole("button", { name: `${code}: Move later to ${label(nextFall)}`, exact: true });
  await later.click();
  await expect(card(page, nextFall, COURSES.csci2041)).toBeVisible();
  await expect(card(page, fall, COURSES.csci2041)).toHaveCount(0);

  await card(page, nextFall, COURSES.csci2041).hover();
  await page.getByRole("button", { name: `${code}: Move earlier to ${label(fall)}`, exact: true }).click();
  await expect(card(page, fall, COURSES.csci2041)).toBeVisible();
  await expect(card(page, nextFall, COURSES.csci2041)).toHaveCount(0);
});

test("reload: the browser autosave restores the plan", async ({ stubbed: page }) => {
  await page.goto("/plan/new");
  await page.getByRole("textbox", { name: "Plan title" }).fill("Reload me");
  await page.getByRole("textbox", { name: "Plan title" }).press("Enter");
  await page.getByRole("button", { name: "Add your major or minor" }).click();
  await page.getByRole("textbox", { name: "Search programs" }).fill("Computer Science B.S.");
  await page.getByRole("button", { name: PROGRAM.name, exact: true }).click();
  await page.getByRole("button", { name: `Select ${label(fall)}: + and Enter add courses here` }).click();
  await page.getByRole("combobox", { name: "Search courses" }).fill(COURSES.csci2011.code);
  await page.getByRole("button", { name: `Add ${COURSES.csci2011.code} to ${label(fall)}`, exact: true }).click();
  await expect(card(page, fall, COURSES.csci2011)).toBeVisible();
  await expect(page.getByText(/^Saved in this browser/)).toBeVisible();

  // /plan/new asks before replacing an autosave; resume it.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Keep your current autosave?" })).toBeVisible();
  await page.getByRole("link", { name: "Resume autosave" }).click();
  await expect(page).toHaveURL(/\/plan\/autosave$/);
  await expect(card(page, fall, COURSES.csci2011)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Plan title" })).toHaveValue("Reload me");
  await expect(page.getByRole("complementary").getByRole("heading", { name: PROGRAM.name })).toBeVisible();

  // And straight from /plan/autosave.
  await page.reload();
  await expect(card(page, fall, COURSES.csci2011)).toBeVisible();
});

test("clicking a course opens its preview card", async ({ stubbed: page }) => {
  await openSeeded(page, seededPlan({ [fall]: [COURSES.csci2041.id] }));
  await card(page, fall, COURSES.csci2041).click();
  const preview = page.getByRole("dialog", { name: `${COURSES.csci2041.code} preview` });
  await expect(preview).toBeVisible();
  await expect(preview.getByText(COURSES.csci2041.title).first()).toBeVisible();
  await expect(preview.getByText(/Principles\/techniques for creating correct/)).toBeVisible();
});

test("share link opens a read-only /share# view", async ({ stubbed: page }) => {
  await openSeeded(page, seededPlan({ [fall]: [COURSES.csci2041.id], [spring]: [COURSES.csci1933.id] }));
  // Controls only the editor has, all visible without hover. Checked here first, so their absence on
  // /share below can't pass just because the locator never matches anything (L13).
  const editorOnly = [
    page.getByRole("combobox", { name: "Search courses" }),
    page.getByRole("textbox", { name: "Plan title" }),
    page.getByRole("button", { name: `Select ${label(fall)}: + and Enter add courses here` }),
    card(page, fall, COURSES.csci2041),
  ];
  for (const control of editorOnly) await expect(control).toBeVisible();

  await page.getByRole("button", { name: "Share snapshot" }).click();
  const link = page.getByRole("textbox", { name: "Read-only snapshot link" });
  await expect(link).toHaveValue(/\/share#v1\./);
  const url = await link.inputValue();
  await page.keyboard.press("Escape");

  // Edit after sharing, so the browser autosave differs from the snapshot.
  await page.getByRole("textbox", { name: "Plan title" }).fill("Local edits");
  await page.getByRole("textbox", { name: "Plan title" }).press("Enter");
  await expect(page.getByText(/^Saved in this browser/)).toBeVisible();
  const autosave = () => page.evaluate((key) => localStorage.getItem(key), AUTOSAVE_KEY);
  const before = await autosave();
  expect(JSON.parse(before ?? "{}")).toMatchObject({ title: "Local edits" });

  await page.goto(url);
  await expect(page.getByText("Read-only plan snapshot")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Smoke test plan", level: 1 })).toBeVisible();
  await expect(page.getByText(`Programs: ${PROGRAM.name}`)).toBeVisible();
  const fallSection = page.locator("section").filter({ has: page.getByRole("heading", { name: label(fall), exact: true }) });
  await expect(fallSection.getByText(COURSES.csci2041.code, { exact: true })).toBeVisible();
  await expect(fallSection.getByText(new RegExp(`^${COURSES.csci2041.title} · 4 cr$`))).toBeVisible();
  // Read-only: none of the editor's controls.
  for (const control of editorOnly) await expect(control).toHaveCount(0);
  // Viewing never saves: the autosave is byte-for-byte what the editor left.
  expect(await autosave()).toBe(before);

  // Copying over an existing autosave asks first, and nothing is written until it's confirmed.
  const copy = page.getByRole("button", { name: "Copy to browser autosave" });
  await copy.click();
  const replace = page.getByRole("checkbox", { name: /Replace this browser’s existing autosave/ });
  await expect(replace).toBeVisible();
  await expect(copy).toBeDisabled();
  expect(await autosave()).toBe(before);
  await replace.check();
  await copy.click();
  await expect(page).toHaveURL(/\/plan\/autosave$/);
  // The copy is titled "<title> (copy)" (copySnapshot) and replaced the local edits.
  await expect(page.getByRole("textbox", { name: "Plan title" })).toHaveValue("Smoke test plan (copy)");
  await expect(card(page, spring, COURSES.csci1933)).toBeVisible();
  expect(JSON.parse((await autosave()) ?? "{}")).toMatchObject({ title: "Smoke test plan (copy)" });
});

test("Export PDF starts a download", async ({ stubbed: page }) => {
  await openSeeded(page, seededPlan({ [fall]: [COURSES.csci2041.id, COURSES.csci1933.id] }));
  await expect(card(page, fall, COURSES.csci1933)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  const bytes = await (await file.createReadStream()).toArray();
  expect(Buffer.concat(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(page.getByText(/^PDF exported/)).toBeVisible();
});
