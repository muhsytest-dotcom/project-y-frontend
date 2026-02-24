import { test, expect } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /signup \/ login/i })).toBeVisible();
});

test("login route loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();
});

test("storefront route loads", async ({ page }) => {
  await page.goto("/storefront");
  await expect(page.getByText(/storefront/i)).toBeVisible();
});
