import { expect, test } from "./fixtures";
import { ERROR_CHECK_MESSAGE } from "../src/features/errors/ErrorCheck";
import { THEME_KEY } from "../src/features/theme/preferences";

/**
 * L6 error reporting (Hadi's Claude, 2026-11-22): a client component throws, the app's error boundary
 * shows the friendly page (no message, no stack), the crash is reported to `/api/client-error` with
 * only the route, a reference, the message and the stack, and "Try again" recovers.
 */

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

  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Error check" })).toBeVisible();
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
  expect((await request.post(url, { data: ok, headers: { origin: baseURL! } })).status()).toBe(204);
});
