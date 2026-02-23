import { expect, Page, test } from "@playwright/test";

const API_PREFIX = "http://127.0.0.1:8000/api/v1";

function json(content: unknown) {
  return { status: 200, contentType: "application/json", body: JSON.stringify(content) };
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

test("login redirects to dashboard and loads store data", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: /login/i }).click();
  await page.getByPlaceholder(/email/i).fill("owner@example.com");
  await page.getByPlaceholder(/password/i).fill("password123");
  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /store operations/i })).toBeVisible();
  await expect(page.locator("select.select").nth(1)).toHaveValue("store-1");
});

test("storefront can add to cart and place an order", async ({ page }) => {
  await page.goto("/storefront");

  await page.getByRole("button", { name: /customize/i }).first().click();
  await page.getByRole("button", { name: /add to cart/i }).click();

  await page.getByPlaceholder(/customer name/i).fill("Guest Buyer");
  await page.getByPlaceholder(/customer email/i).fill("guest@example.com");
  await page.getByPlaceholder(/customer phone/i).fill("+966500000000");
  await page.getByPlaceholder(/shipping name/i).fill("Guest Buyer");
  await page.getByPlaceholder(/address line 1/i).fill("Riyadh Road 1");
  await page.getByPlaceholder(/city/i).fill("Riyadh");

  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page.getByText(/order created/i)).toBeVisible();
  await expect(page.getByText(/ord-2001/i)).toBeVisible();
});
