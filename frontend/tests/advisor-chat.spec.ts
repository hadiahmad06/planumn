import { test, expect } from "@playwright/test";

test.describe("AdvisorChat", () => {
  test("opens panel and streams a response", async ({ page }) => {
    // Assumes `npm run dev` is running and you are already
    // authenticated in this browser context (e.g. via storageState).
    await page.goto("/");

    // Wait for the main plan display to be visible (adjust selector if needed)
    await expect(
      page.getByText(/planu\.mn|My Plan|Graduation Plan/i).first()
    ).toBeVisible({ timeout: 30_000 });

    // Open the AI Advisor floating button
    const advisorButton = page.getByRole("button", { name: /ai advisor/i });
    await advisorButton.click();

    // Type a basic question and send
    const textarea = page.getByPlaceholder(/ask about your plan/i);
    await textarea.click();
    await textarea.fill("How many credits am I taking next semester?");
    await textarea.press("Enter");

    // Expect streaming reply text to eventually appear
    const assistantBubble = page
      .getByText(/credits|semester|plan/i)
      .first();

    await expect(assistantBubble).toBeVisible({ timeout: 60_000 });
  });
});

