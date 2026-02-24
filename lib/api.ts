export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/v1";

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  is_email_verified?: boolean;
};

export type AuthSessionResponse = {
  token_type: string;
  user: AuthUser;
};

export type SignupResponse = {
  user: AuthUser;
  store: { id: string | null; name: string | null; slug: string | null };
  pending_verification: boolean;
  verification_token?: string | null;
  otp?: string | null;
  expires_in_seconds?: number;
  created?: boolean;
};

export type StoreMembership = {
  store_id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  name: string;
  slug: string;
  publish_status: string;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("=") || "");
    }
  }
  return "";
}

async function parseError(response: Response): Promise<{ message: string; payload: unknown }> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = await response.text();
  }

  if (typeof payload === "string" && payload.trim()) {
    return { message: payload, payload };
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.detail === "string") {
      return { message: obj.detail, payload: obj };
    }
    const firstKey = Object.keys(obj)[0];
    if (firstKey) {
      const value = obj[firstKey];
      if (Array.isArray(value) && value.length > 0) {
        return { message: `${firstKey}: ${String(value[0])}`, payload: obj };
      }
      if (typeof value === "string") {
        return { message: `${firstKey}: ${value}`, payload: obj };
      }
    }
    return { message: JSON.stringify(obj), payload: obj };
  }
  return { message: `Request failed (${response.status})`, payload };
}

export async function apiFetch<T>(
  path: string,
  {
    method = "GET",
    token,
    body,
    headers,
  }: { method?: ApiMethod; token?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const initHeaders: Record<string, string> = {
    Accept: "application/json; version=1",
    ...(headers || {}),
  };

  if (body !== undefined) {
    initHeaders["Content-Type"] = "application/json";
  }
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      initHeaders["X-CSRFToken"] = csrfToken;
    }
  }
  if (token) {
    initHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: initHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const parsed = await parseError(response);
    throw new ApiError(parsed.message, response.status, parsed.payload);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  signup(input: { full_name: string; email: string; password: string; brand: string; country_code: string }) {
    return apiFetch<SignupResponse>("/auth/signup", {
      method: "POST",
      body: input,
    });
  },
  login(email: string, password: string) {
    return apiFetch<AuthSessionResponse>("/auth/login", { method: "POST", body: { email, password } });
  },
  refresh() {
    return apiFetch<{ token_type: string }>("/auth/refresh", { method: "POST", body: {} });
  },
  logout() {
    return apiFetch<Record<string, never>>("/auth/logout", { method: "POST", body: {} });
  },
  verifyEmailByToken(token: string) {
    return apiFetch<{ user: AuthUser }>("/auth/verify-email", { method: "POST", body: { token } });
  },
  verifyEmailByOtp(email: string, otp: string) {
    return apiFetch<{ user: AuthUser }>("/auth/verify-email", { method: "POST", body: { email, otp } });
  },
  resendVerification(email: string) {
    return apiFetch<{ pending_verification: boolean; verification_token?: string | null; otp?: string | null }>(
      "/auth/resend-verification",
      { method: "POST", body: { email } },
    );
  },
  me(token?: string) {
    return apiFetch<AuthUser>("/auth/me", { token });
  },
  meStores(token?: string) {
    return apiFetch<{ stores: StoreMembership[] }>("/auth/me/stores", { token });
  },
};

export const storesApi = {
  getStore(token: string, storeId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}`, { token });
  },
  patchStore(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}`, { token, method: "PATCH", body });
  },
  getSettings(token: string, storeId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/settings`, { token });
  },
  patchSettings(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/settings`, { token, method: "PATCH", body });
  },
  getOnboarding(token: string, storeId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/onboarding`, { token });
  },
  patchOnboarding(token: string, storeId: string, step: string, completed: boolean) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/onboarding`, {
      token,
      method: "PATCH",
      body: { step, completed },
    });
  },
  publish(token: string, storeId: string) {
    return apiFetch<{ publish_status: string }>(`/stores/${storeId}/publish`, { token, method: "POST" });
  },
  unpublish(token: string, storeId: string) {
    return apiFetch<{ publish_status: string }>(`/stores/${storeId}/unpublish`, { token, method: "POST" });
  },
  listDomains(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/domains`, { token });
  },
  createDomain(token: string, storeId: string, body: { host: string; type: "subdomain" | "custom"; is_primary?: boolean }) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/domains`, { token, method: "POST", body });
  },
  verifyDomain(token: string, storeId: string, domainId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/domains/${domainId}/verify`, { token, method: "POST" });
  },
  makePrimaryDomain(token: string, storeId: string, domainId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/domains/${domainId}/make-primary`, { token, method: "POST" });
  },
  deleteDomain(token: string, storeId: string, domainId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/domains/${domainId}`, { token, method: "DELETE" });
  },
  createPreviewToken(token: string, storeId: string) {
    return apiFetch<{ preview_token: string; expires_in: number }>(`/stores/${storeId}/preview-token`, { token, method: "POST" });
  },
};

export const catalogApi = {
  listProducts(token: string, storeId: string, query = "limit=20&offset=0") {
    return apiFetch<{ items: Array<Record<string, unknown>>; pagination: Record<string, unknown> }>(`/stores/${storeId}/products?${query}`, { token });
  },
  createProduct(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/products`, { token, method: "POST", body });
  },
  patchProduct(token: string, storeId: string, productId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/products/${productId}`, { token, method: "PATCH", body });
  },
  deleteProduct(token: string, storeId: string, productId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/products/${productId}`, { token, method: "DELETE" });
  },
  listCategories(token: string, storeId: string, query = "limit=20&offset=0") {
    return apiFetch<{ items: Array<Record<string, unknown>>; pagination: Record<string, unknown> }>(`/stores/${storeId}/categories?${query}`, { token });
  },
  createCategory(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/categories`, { token, method: "POST", body });
  },
  patchCategory(token: string, storeId: string, categoryId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/categories/${categoryId}`, { token, method: "PATCH", body });
  },
  deleteCategory(token: string, storeId: string, categoryId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/categories/${categoryId}`, { token, method: "DELETE" });
  },
  linkProductCategory(token: string, storeId: string, productId: string, categoryId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/products/${productId}/categories/${categoryId}`, { token, method: "POST" });
  },
  unlinkProductCategory(token: string, storeId: string, productId: string, categoryId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/products/${productId}/categories/${categoryId}`, { token, method: "DELETE" });
  },
  listOptions(token: string, storeId: string, productId: string) {
    return apiFetch<Array<Record<string, unknown>>>(`/stores/${storeId}/products/${productId}/options`, { token });
  },
  createOption(token: string, storeId: string, productId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/products/${productId}/options`, { token, method: "POST", body });
  },
  createOptionValue(token: string, storeId: string, productId: string, optionId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/products/${productId}/options/${optionId}/values`, {
      token,
      method: "POST",
      body,
    });
  },
  listDiscounts(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/discounts`, { token });
  },
  createDiscount(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/discounts`, { token, method: "POST", body });
  },
  patchDiscount(token: string, storeId: string, discountId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/discounts/${discountId}`, { token, method: "PATCH", body });
  },
  deleteDiscount(token: string, storeId: string, discountId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/discounts/${discountId}`, { token, method: "DELETE" });
  },
  listShippingRules(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/shipping-rules`, { token });
  },
  createShippingRule(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/shipping-rules`, { token, method: "POST", body });
  },
  patchShippingRule(token: string, storeId: string, ruleId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/shipping-rules/${ruleId}`, { token, method: "PATCH", body });
  },
  deleteShippingRule(token: string, storeId: string, ruleId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/shipping-rules/${ruleId}`, { token, method: "DELETE" });
  },
};

export const contentApi = {
  listSections(token: string, storeId: string, pageKey?: string) {
    const query = pageKey ? `?page_key=${encodeURIComponent(pageKey)}` : "";
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/sections${query}`, { token });
  },
  createSection(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/sections`, { token, method: "POST", body });
  },
  patchSection(token: string, storeId: string, sectionId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/sections/${sectionId}`, { token, method: "PATCH", body });
  },
  deleteSection(token: string, storeId: string, sectionId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/sections/${sectionId}`, { token, method: "DELETE" });
  },
  listThemes(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/themes`, { token });
  },
  activateTheme(token: string, storeId: string, themeId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/themes/${themeId}/activate`, { token, method: "POST" });
  },
};

export const ordersApi = {
  list(token: string, storeId: string, query = "limit=20&offset=0") {
    return apiFetch<{ items: Array<Record<string, unknown>>; pagination: Record<string, unknown> }>(`/stores/${storeId}/orders?${query}`, { token });
  },
  detail(token: string, storeId: string, orderId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/orders/${orderId}`, { token });
  },
  updateStatus(token: string, storeId: string, orderId: string, statusValue: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/orders/${orderId}/status`, {
      token,
      method: "PATCH",
      body: { status: statusValue },
    });
  },
  updatePaymentStatus(token: string, storeId: string, orderId: string, paymentStatus: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/orders/${orderId}/payment-status`, {
      token,
      method: "PATCH",
      body: { payment_status: paymentStatus },
    });
  },
  events(token: string, storeId: string, orderId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/orders/${orderId}/events`, { token });
  },
  resendEmail(token: string, storeId: string, orderId: string) {
    return apiFetch<{ queued: boolean }>(`/stores/${storeId}/orders/${orderId}/resend-email`, { token, method: "POST" });
  },
};

export const customersApi = {
  list(token: string, storeId: string, query = "limit=20&offset=0") {
    return apiFetch<{ items: Array<Record<string, unknown>>; pagination: Record<string, unknown> }>(`/stores/${storeId}/customers?${query}`, {
      token,
    });
  },
  detail(token: string, storeId: string, customerId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/customers/${customerId}`, { token });
  },
  patch(token: string, storeId: string, customerId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/customers/${customerId}`, { token, method: "PATCH", body });
  },
  remove(token: string, storeId: string, customerId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/customers/${customerId}`, { token, method: "DELETE" });
  },
  listAddresses(token: string, storeId: string, customerId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/customers/${customerId}/addresses`, { token });
  },
  createAddress(token: string, storeId: string, customerId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/customers/${customerId}/addresses`, {
      token,
      method: "POST",
      body,
    });
  },
  patchAddress(token: string, storeId: string, customerId: string, addressId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/customers/${customerId}/addresses/${addressId}`, {
      token,
      method: "PATCH",
      body,
    });
  },
  deleteAddress(token: string, storeId: string, customerId: string, addressId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/customers/${customerId}/addresses/${addressId}`, {
      token,
      method: "DELETE",
    });
  },
};

export const notificationsApi = {
  listEmailEvents(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/email-events`, { token });
  },
  sendConfirmation(token: string, storeId: string, orderId: string, provider: "smtp" | "resend" | "ses" = "smtp") {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/orders/${orderId}/send-confirmation-email`, {
      token,
      method: "POST",
      body: { provider },
    });
  },
  whatsappPreview(token: string, storeId: string, orderId: string) {
    return apiFetch<{ message: string; whatsapp_url: string }>(`/stores/${storeId}/orders/${orderId}/whatsapp-preview`, { token });
  },
};

export const analyticsApi = {
  overview(token: string, storeId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/analytics/overview`, { token });
  },
  topProducts(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/analytics/top-products`, { token });
  },
  searchQueries(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/analytics/search-queries`, { token });
  },
  ordersTimeseries(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/analytics/orders-timeseries`, { token });
  },
  emailSummary(token: string, storeId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/analytics/email-summary`, { token });
  },
  ingestPublicEvent(body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/public/analytics/events`, { method: "POST", body });
  },
};

export const billingApi = {
  getSubscription(token: string, storeId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/subscription`, { token });
  },
  patchSubscription(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/subscription`, { token, method: "PATCH", body });
  },
  markPaid(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/subscription/mark-paid`, { token, method: "POST", body });
  },
};

export const integrationsApi = {
  listWebhooks(token: string, storeId: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/stores/${storeId}/webhooks`, { token });
  },
  createWebhook(token: string, storeId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/webhooks`, { token, method: "POST", body });
  },
  patchWebhook(token: string, storeId: string, webhookId: string, body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/webhooks/${webhookId}`, { token, method: "PATCH", body });
  },
  deleteWebhook(token: string, storeId: string, webhookId: string) {
    return apiFetch<Record<string, never>>(`/stores/${storeId}/webhooks/${webhookId}`, { token, method: "DELETE" });
  },
  testWebhook(token: string, storeId: string, webhookId: string) {
    return apiFetch<Record<string, unknown>>(`/stores/${storeId}/webhooks/${webhookId}/test`, { token, method: "POST" });
  },
};

export const publicApi = {
  store(previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/store`, {
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  sections(pageKey = "home", previewToken?: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/public/sections?page_key=${encodeURIComponent(pageKey)}`, {
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  categories(previewToken?: string) {
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/public/categories`, {
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  products(search = "", categoryId = "", previewToken?: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("category_id", categoryId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<{ items: Array<Record<string, unknown>> }>(`/public/products${query}`, {
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  product(slug: string, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/products/${slug}`, {
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  quote(body: Record<string, unknown>, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/checkout/quote`, {
      method: "POST",
      body,
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  createOrder(body: Record<string, unknown>, idempotencyKey: string, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/orders`, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": idempotencyKey, ...(previewToken ? { "X-Store-Preview-Token": previewToken } : {}) },
    });
  },
  orderConfirmation(confirmationToken: string, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/orders/${encodeURIComponent(confirmationToken)}/confirmation`, {
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  createCart(body?: Record<string, unknown>, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/carts`, {
      method: "POST",
      body: body || {},
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  cart(cartToken: string, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/carts/${cartToken}`, {
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  addCartItem(cartToken: string, body: Record<string, unknown>, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/carts/${cartToken}/items`, {
      method: "POST",
      body,
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  updateCartItem(cartToken: string, itemId: string, body: Record<string, unknown>, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/carts/${cartToken}/items/${itemId}`, {
      method: "PATCH",
      body,
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  deleteCartItem(cartToken: string, itemId: string, previewToken?: string) {
    return apiFetch<Record<string, never>>(`/public/carts/${cartToken}/items/${itemId}`, {
      method: "DELETE",
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  applyDiscount(cartToken: string, body: Record<string, unknown>, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/carts/${cartToken}/apply-discount`, {
      method: "POST",
      body,
      headers: previewToken ? { "X-Store-Preview-Token": previewToken } : undefined,
    });
  },
  checkoutCart(cartToken: string, body: Record<string, unknown>, idempotencyKey: string, previewToken?: string) {
    return apiFetch<Record<string, unknown>>(`/public/carts/${cartToken}/checkout`, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": idempotencyKey, ...(previewToken ? { "X-Store-Preview-Token": previewToken } : {}) },
    });
  },
};
