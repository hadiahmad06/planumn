import { expect, test } from "./fixtures";
import { type Page } from "@playwright/test";
import { ERROR_CHECK_MESSAGE, SERVER_ERROR_CHECK_MESSAGE } from "../src/features/errors/checks";
import { THEME_KEY } from "../src/features/theme/preferences";

/**
 * L6 error reporting (Hadi's Claude, 2026-11-22): a client component throws, the app's error boundary
 * shows the friendly page (no message, no stack), the crash is reported to `/api/client-error` with
 * only the route, a reference, the message and the stack, and "Try again" recovers.
 * Review fixes on #115: `/plan`'s own boundary reports too (M1), one report per page load (M3), the root
 * layout survives a page crash (N2: fails if `src/app/error.tsx` is gone and `global-error` takes over),
 * and server errors are not reported again from the browser (N2: the digest skip in `ErrorScreen`).
 */

/** Counts POSTs to /api/client-error from now on. */
function countReports(page: Page) {
  const bodies: Record<string, unknown>[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/api/client-error") && r.method() === "POST") bodies.push(JSON.parse(r.postData() ?? "{}"));
  });
  return bodies;
}

/** Set only by the root layout (`next/font` Geist variables); `global-error` renders without it. */
async function rootLayoutKept(page: Page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim() !== "");
}

test("a client component throws → friendly error page, report sent, Try again recovers", async ({ stubbed: page }) => {
  await page.goto("/info/error-check?from=e2e#fragment");
  await expect(page.getByRole("heading", { name: "Error check" })).toBeVisible();

  const reported = page.waitForRequest((r) => r.url().endsWith("/api/client-error") && r.method() === "POST");
  const answered = page.waitForResponse((r) => r.url().endsWith("/api/client-error"));
  await page.getByRole("button", { name: "Throw a test error" }).click();

  const alert = page.getByRole("alert", { name: "This page hit a snag" });
  await expect(alert.getByRole("heading", { name: "This page hit a snag" })).toBeVisible();
  await expect(alert.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(alert.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
  // Never the error's message or a stack trace, only a reference.
  await expect(page.getByText(ERROR_CHECK_MESSAGE)).toHaveCount(0);
  await expect(page.getByText(/at \w+ \(/)).toHaveCount(0);
  const reference = (await alert.locator(".font-mono").textContent())!;
  expect(reference).toMatch(/^c-[0-9a-f]{8}$/);

  const body = JSON.parse((await reported).postData() ?? "{}");
  expect(Object.keys(body).sort()).toEqual(["digest", "message", "route", "stack"]);
  expect(body).toMatchObject({ route: "/info/error-check", digest: reference, message: ERROR_CHECK_MESSAGE });
  expect((await answered).status()).toBe(204);

  // N2: caught inside the root layout (app/error.tsx), not by global-error.
  expect(await rootLayoutKept(page)).toBe(true);
  await expect(page).toHaveTitle("Something went wrong | planu.mn");

  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Error check" })).toBeVisible();
});

test("M3: one report per page load, and the same reference after Try again", async ({ stubbed: page }) => {
  const reports = countReports(page);
  await page.goto("/info/error-check");
  const alert = page.getByRole("alert", { name: "This page hit a snag" });
  await page.getByRole("button", { name: "Throw a test error" }).click();
  const first = await alert.locator(".font-mono").textContent();
  await expect.poll(() => reports.length).toBe(1);
  await alert.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("button", { name: "Throw a test error" }).click();
  await expect(alert.locator(".font-mono")).toHaveText(first!);
  await page.waitForTimeout(1000);
  expect(reports).toHaveLength(1);
});

test("M1: a crash under /plan uses the plan boundary and is reported", async ({ stubbed: page }) => {
  const reports = countReports(page);
  await page.goto("/plan/error-check");
  await page.getByRole("button", { name: "Throw a test error" }).click();
  const alert = page.getByRole("alert", { name: "The plan could not be displayed" });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("link", { name: "Go to the home page" })).toBeVisible();
  await expect(page.getByText(ERROR_CHECK_MESSAGE)).toHaveCount(0);
  await expect.poll(() => reports.length).toBe(1);
  expect(reports[0]).toMatchObject({ route: "/plan/error-check", message: ERROR_CHECK_MESSAGE });
  expect(reports[0].digest).toBe(await alert.locator(".font-mono").textContent());
  expect(await rootLayoutKept(page)).toBe(true);
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Error check" })).toBeVisible();
});

test("N2: a Server Component error shows its digest and is not reported again from the browser", async ({ stubbed: page }) => {
  const reports = countReports(page);
  await page.goto("/info/error-check/server");
  const alert = page.getByRole("alert", { name: "This page hit a snag" });
  await expect(alert).toBeVisible();
  await expect(alert.locator(".font-mono")).toHaveText(/^\d+$/);
  await expect(page.getByText(SERVER_ERROR_CHECK_MESSAGE)).toHaveCount(0);
  expect(await rootLayoutKept(page)).toBe(true);
  await page.waitForTimeout(1500);
  expect(reports).toHaveLength(0);
});

test("the error page follows the dark theme and links home", async ({ stubbed: page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "dark"), THEME_KEY);
  await page.goto("/info/error-check");
  await page.getByRole("button", { name: "Throw a test error" }).click();
  const alert = page.getByRole("alert", { name: "This page hit a snag" });
  await expect(alert).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // --bg-surface in dark mode (#211b1e).
  await expect(alert).toHaveCSS("background-color", "rgb(33, 27, 30)");

  await alert.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Start a plan" }).first()).toBeVisible();
});

test("an unknown URL shows the 404 page with a link home", async ({ stubbed: page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("/api/client-error rejects other origins and malformed reports", async ({ request, baseURL }) => {
  const url = `${baseURL}/api/client-error`;
  const ok = { route: "/x", digest: "c-00000000", message: "m" };
  expect((await request.post(url, { data: ok, headers: { origin: "https://evil.example" } })).status()).toBe(403);
  expect((await request.post(url, { data: { route: "/x" }, headers: { origin: baseURL! } })).status()).toBe(400);
  // M3: a forged server digest is refused.
  expect((await request.post(url, { data: { ...ok, digest: "2502068178" }, headers: { origin: baseURL! } })).status()).toBe(400);
  expect((await request.post(url, { data: ok, headers: { origin: baseURL! } })).status()).toBe(204);
});
