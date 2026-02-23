import { expect, test } from "@playwright/test";

test.describe("real backend integration", () => {
  test.skip(!process.env.E2E_REAL_BACKEND, "Set E2E_REAL_BACKEND=1 to run real backend e2e.");

  test("auth -> dashboard -> preview storefront route", async ({ page }) => {
    const runId = Date.now();
    const email = `owner+${runId}@example.com`;
    const password = "password123";

    await page.goto("/auth");

    await page.getByRole("button", { name: /^signup$/i }).click();
    await page.getByPlaceholder(/full name/i).fill("Owner Real");
    await page.getByPlaceholder(/^brand$/i).fill(`Brand ${runId}`);
    await page.getByPlaceholder(/country code/i).fill("SA");
    await page.getByPlaceholder(/^email$/i).fill(email);
    await page.getByPlaceholder(/^password$/i).fill(password);
    await page.getByRole("button", { name: /^submit$/i }).click();

    await page.getByRole("button", { name: /^verify$/i }).click();
    await expect(page.getByPlaceholder(/verification token/i)).toHaveValue(/[0-9a-f-]{8,}/i);
    await page.getByRole("button", { name: /^submit$/i }).click();

    await page.getByRole("button", { name: /^login$/i }).click();
    await page.getByPlaceholder(/^email$/i).fill(email);
    await page.getByPlaceholder(/^password$/i).fill(password);
    await page.getByRole("button", { name: /^submit$/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /store operations/i })).toBeVisible();

    await page.getByRole("button", { name: /preview/i }).first().click();
    await expect(page).toHaveURL(/\/storefront\/preview\//);
    await expect(page.getByText(/preview mode/i)).toBeVisible();
  });
});
