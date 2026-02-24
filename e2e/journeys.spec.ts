import { expect, Page, test } from "@playwright/test";

const API_PREFIX = process.env.E2E_API_BASE || "http://127.0.0.1:8000/api/v1";
const APP_ORIGIN = `http://127.0.0.1:${process.env.E2E_PORT || "3101"}`;

function json(content: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": APP_ORIGIN,
      "access-control-allow-credentials": "true",
    },
    body: JSON.stringify(content),
  };
}

async function installApiMock(page: Page) {
  const storeId = "store-1";
  const cartToken = "cart-1";
  let cartItems: Array<{ id: string; product_id: string; quantity: number; line_total_amount_minor: number; options: Array<{ option_value_id: string }> }> = [];

  await page.route(`${API_PREFIX}/**`, async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");

    if (method === "OPTIONS") {
      return route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": APP_ORIGIN,
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
          "access-control-allow-headers": "content-type,authorization,accept",
        },
      });
    }

    if (path === "/auth/login" && method === "POST") {
      return route.fulfill(json({
        access: "access-token",
        refresh: "refresh-token",
        token_type: "Bearer",
        user: { id: "user-1", full_name: "Owner", email: "owner@example.com" },
      }));
    }

    if (path === "/auth/me/stores" && method === "GET") {
      return route.fulfill(json({ stores: [{ store_id: storeId, role: "owner", name: "Demo Store", slug: "demo-store", publish_status: "draft" }] }));
    }

    if (path === `/stores/${storeId}` && method === "GET") {
      return route.fulfill(json({ id: storeId, name: "Demo Store", publish_status: "draft" }));
    }
    if (path === `/stores/${storeId}/settings` && method === "GET") {
      return route.fulfill(json({ seo_title: "Demo", seo_description: "Demo desc" }));
    }
    if (path === `/stores/${storeId}/onboarding` && method === "GET") {
      return route.fulfill(json({ steps: {} }));
    }
    if (path === `/stores/${storeId}/domains` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/products` && method === "GET") {
      return route.fulfill(json({ items: [{ id: "p-1", name: "Perfume", slug: "perfume", base_price_amount_minor: 1000, currency_code: "SAR" }], pagination: {} }));
    }
    if (path === `/stores/${storeId}/products/p-1/options` && method === "GET") {
      return route.fulfill(
        json([
          {
            id: "op-1",
            name: "Size",
            option_kind: "variant",
            selection_type: "single",
            values: [
              { id: "ov-1", label: "50ml", price_delta_minor: 0 },
              { id: "ov-2", label: "100ml", price_delta_minor: 500 },
            ],
          },
        ]),
      );
    }
    if (path === `/stores/${storeId}/categories` && method === "GET") {
      return route.fulfill(json({ items: [{ id: "c-1", name: "Featured", slug: "featured" }], pagination: {} }));
    }
    if (path === `/stores/${storeId}/discounts` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/shipping-rules` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/orders` && method === "GET") {
      return route.fulfill(json({ items: [{ id: "o-1", order_number: "ORD-1001", total_amount_minor: 1000, currency_code: "SAR", status: "pending" }], pagination: {} }));
    }
    if (path === `/stores/${storeId}/customers` && method === "GET") {
      return route.fulfill(json({ items: [{ id: "u-1", full_name: "Guest", email: "guest@example.com" }], pagination: {} }));
    }
    if (path === `/stores/${storeId}/analytics/overview` && method === "GET") {
      return route.fulfill(json({ visitors: 10, orders: 1, conversion_rate: 10 }));
    }
    if (path === `/stores/${storeId}/analytics/top-products` && method === "GET") {
      return route.fulfill(json({ items: [{ product_name: "Perfume", count: 1 }] }));
    }
    if (path === `/stores/${storeId}/analytics/search-queries` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/analytics/orders-timeseries` && method === "GET") {
      return route.fulfill(json({ items: [{ day: "2026-02-20", orders: 2 }, { day: "2026-02-21", orders: 1 }] }));
    }
    if (path === `/stores/${storeId}/analytics/email-summary` && method === "GET") {
      return route.fulfill(json({ sent: 3, failed: 0 }));
    }
    if (path === `/stores/${storeId}/sections` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/themes` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/email-events` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/subscription` && method === "GET") {
      return route.fulfill(json({ plan_code: "pro", status: "active" }));
    }
    if (path === `/stores/${storeId}/webhooks` && method === "GET") {
      return route.fulfill(json({ items: [] }));
    }
    if (path === `/stores/${storeId}/preview-token` && method === "POST") {
      return route.fulfill(json({ preview_token: "preview-token-1", expires_in: 1800 }));
    }

    if (path === "/public/store" && method === "GET") {
      return route.fulfill(json({ id: storeId, name: "Demo Store", default_currency: "SAR" }));
    }
    if (path === "/public/sections" && method === "GET") {
      return route.fulfill(json({ items: [{ id: "s-1", title: "Hero" }] }));
    }
    if (path === "/public/categories" && method === "GET") {
      return route.fulfill(json({ items: [{ id: "c-1", name: "Featured" }] }));
    }
    if (path === "/public/products" && method === "GET") {
      return route.fulfill(json({ items: [{ id: "p-1", name: "Perfume", slug: "perfume", price_amount_minor: 1000, currency_code: "SAR" }] }));
    }
    if (path === "/public/products/perfume" && method === "GET") {
      return route.fulfill(
        json({
          id: "p-1",
          name: "Perfume",
          slug: "perfume",
          price_amount_minor: 1000,
          currency_code: "SAR",
          options: [
            {
              id: "op-1",
              name: "Size",
              selection_type: "single",
              is_required: true,
              min_select: 1,
              max_select: 1,
              values: [
                { id: "ov-1", label: "50ml", price_delta_minor: 0 },
                { id: "ov-2", label: "100ml", price_delta_minor: 500 },
              ],
            },
          ],
        }),
      );
    }
    if (path === "/public/analytics/events" && method === "POST") {
      return route.fulfill(json({ ok: true }));
    }

    if (path === "/public/carts" && method === "POST") {
      return route.fulfill(json({ token: cartToken, currency_code: "SAR", items: cartItems }));
    }
    if (path === `/public/carts/${cartToken}` && method === "GET") {
      return route.fulfill(json({ token: cartToken, currency_code: "SAR", items: cartItems }));
    }
    if (path === `/public/carts/${cartToken}/items` && method === "POST") {
      const body = request.postDataJSON() as { product_id: string; quantity: number; option_value_ids: string[] };
      cartItems = [
        {
          id: "ci-1",
          product_id: body.product_id,
          quantity: body.quantity,
          line_total_amount_minor: 1000 * body.quantity,
          options: (body.option_value_ids || []).map((id) => ({ option_value_id: id })),
        },
      ];
      return route.fulfill(json({ ok: true }));
    }
    if (path === `/public/carts/${cartToken}/checkout` && method === "POST") {
      return route.fulfill(
        json({
          order_number: "ORD-2001",
          total_amount_minor: 1000,
          currency_code: "SAR",
          status: "pending",
          confirmation_url: "/storefront/confirmation/token-1",
          whatsapp_url: "https://wa.me/966500000000",
        }),
      );
    }

    return route.fulfill({ status: 404, body: `Unhandled mock route: ${method} ${path}` });
  });
}

test.beforeEach(async ({ page }) => {
  await installApiMock(page);
});

async function seedDashboardSession(page: Page) {
  await page.context().addCookies([
    {
      name: "projecty_refresh",
      value: "refresh-token",
      domain: "127.0.0.1",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      secure: false,
    },
  ]);
}

test("dashboard loads store data with stored session", async ({ page }) => {
  await seedDashboardSession(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /store operations/i })).toBeVisible();
  await expect(page.locator("p.mt-1.text-2xl.font-black").first()).toBeVisible();
});

test("cookie-backed session survives page refresh", async ({ page }) => {
  await seedDashboardSession(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /store operations/i })).toBeVisible();

  const beforeRefresh = await page.context().cookies(APP_ORIGIN);
  expect(beforeRefresh.some((c) => c.name === "projecty_refresh")).toBe(true);

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /store operations/i })).toBeVisible();

  const afterRefresh = await page.context().cookies(APP_ORIGIN);
  expect(afterRefresh.some((c) => c.name === "projecty_refresh")).toBe(true);
});

test("storefront can add to cart and place an order", async ({ page }) => {
  await page.goto("/storefront");

  await expect(page.getByText(/perfume/i).first()).toBeVisible();
  await page.getByRole("button", { name: /customize|تخصيص/i }).first().click();
  await page.locator('input[type="radio"], input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: /add to cart|اضافة للسلة|إضافة للسلة/i }).click();

  await page.getByPlaceholder(/customer name/i).fill("Guest Buyer");
  await page.getByPlaceholder(/customer email/i).fill("guest@example.com");
  await page.getByPlaceholder(/customer phone/i).fill("+966500000000");
  await page.getByPlaceholder(/shipping name/i).fill("Guest Buyer");
  await page.getByPlaceholder(/address line 1/i).fill("Riyadh Road 1");
  await page.getByPlaceholder(/city/i).fill("Riyadh");

  await page.getByRole("button", { name: /place order|تأكيد الطلب|إنشاء الطلب/i }).click();

  await expect(page.getByText(/order created/i)).toBeVisible();
  await expect(page.getByText(/ord-2001/i)).toBeVisible();
});

test("preview storefront supports simulated checkout flow", async ({ page }) => {
  const previewToken = "preview-token-1";

  await page.goto(`/storefront/preview/${previewToken}`);
  await expect(page.getByText(/preview mode/i)).toBeVisible();

  await expect(page.getByText(/perfume/i).first()).toBeVisible();
  await page.getByRole("button", { name: /customize|تخصيص/i }).first().click();
  await page.locator('input[type="radio"], input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: /add to cart|اضافة للسلة|إضافة للسلة/i }).click();

  await page.getByRole("button", { name: /get quote|احسب السعر/i }).click();
  await page.getByPlaceholder(/customer name/i).fill("Preview Buyer");
  await page.getByPlaceholder(/customer email/i).fill("preview@example.com");
  await page.getByPlaceholder(/shipping name/i).fill("Preview Buyer");
  await page.getByPlaceholder(/address line 1/i).fill("Preview Road 1");
  await page.getByPlaceholder(/city/i).fill("Riyadh");
  await page.getByRole("button", { name: /place order|تأكيد الطلب|إنشاء الطلب/i }).click();

  await expect(page.getByText(/order created/i)).toBeVisible();
  await expect(page.getByText(/preview-\d{6}/i)).toBeVisible();
});
