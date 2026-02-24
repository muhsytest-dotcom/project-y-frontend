import { expect, test } from "@playwright/test";

test.describe("real backend integration", () => {
  test("auth -> dashboard -> create product -> preview storefront route", async ({ page }) => {
    test.setTimeout(60_000);
    const apiBase = process.env.E2E_API_BASE || "http://127.0.0.1:8000/api/v1";
    const runId = Date.now();
    const email = `owner+${runId}@example.com`;
    const password = "password123";
    const productName = `Perfume ${runId}`;
    const productSlug = `perfume-${runId}`;

    await page.goto("/auth");

    await page.getByRole("button", { name: /^signup$/i }).click();
    await page.getByPlaceholder(/full name/i).fill("Owner Real");
    await page.getByPlaceholder(/^brand$/i).fill(`Brand ${runId}`);
    await page.getByPlaceholder(/country code/i).fill("SA");
    await page.getByPlaceholder(/^email$/i).fill(email);
    await page.getByPlaceholder(/^password$/i).fill(password);
    const signupResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/auth/signup") && res.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^submit$/i }).click();
    const signupResponse = await signupResponsePromise;
    expect(signupResponse.status()).toBe(201);

    const verificationInput = page.getByPlaceholder(/verification token/i);
    let verifiedViaUi = false;
    if (await verificationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(verificationInput).toHaveValue(/[0-9a-f-]{8,}/i);
      await page.getByRole("button", { name: /^submit$/i }).click();
      verifiedViaUi = true;
    }

    if (!verifiedViaUi) {
      const resendResponse = await page.request.post(`${apiBase}/auth/resend-verification`, {
        data: { email },
        headers: { Accept: "application/json; version=1" },
      });
      expect(resendResponse.ok()).toBeTruthy();
      const resendText = await resendResponse.text();
      const resendData = resendText ? JSON.parse(resendText) : {};
      const verificationToken = String(resendData.verification_token || "");
      if (verificationToken) {
        const verifyResponse = await page.request.post(`${apiBase}/auth/verify-email`, {
          data: { token: verificationToken },
          headers: { Accept: "application/json; version=1" },
        });
        expect(verifyResponse.ok()).toBeTruthy();
      }
    }

    await page.getByRole("button", { name: /^login$/i }).click();
    await page.getByPlaceholder(/^email$/i).fill(email);
    await page.getByPlaceholder(/^password$/i).fill(password);
    await page.getByRole("button", { name: /^submit$/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /store operations/i })).toBeVisible();

    await page.getByRole("button", { name: /catalog/i }).click();
    await expect(page.getByTestId("catalog-create-product-form")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("catalog-create-product-name").fill(productName);
    await page.getByTestId("catalog-create-product-slug").fill(productSlug);
    await page.getByTestId("catalog-create-product-price").fill("1500");
    await page.getByTestId("catalog-create-product-currency").fill("SAR");
    await page.getByTestId("catalog-create-product-submit").click();
    await expect(page.getByRole("cell", { name: productName })).toBeVisible();

    await page.getByRole("button", { name: /preview/i }).first().click();
    await expect(page).toHaveURL(/\/storefront\/preview\//);
    await expect(page.getByText(/preview mode/i)).toBeVisible();
  });
});
