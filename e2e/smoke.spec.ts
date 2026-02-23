import { test, expect } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /signup \/ login/i })).toBeVisible();
});

test("auth route loads", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("button", { name: /signup/i })).toBeVisible();
});

test("storefront route loads", async ({ page }) => {
  await page.goto("/storefront");
  await expect(page.getByText(/storefront/i)).toBeVisible();
});
