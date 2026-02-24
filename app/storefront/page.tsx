"use client";

import { useEffect, useMemo, useState } from "react";
import { analyticsApi, publicApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast, ToastStack } from "@/components/ui/ToastStack";
import { HeaderSection } from "@/components/storefront/HeaderSection";
import { StoreAndSearchSection } from "@/components/storefront/StoreAndSearchSection";
import { ProductsAndConfiguratorSection } from "@/components/storefront/ProductsAndConfiguratorSection";
import { CartAndCheckoutSection } from "@/components/storefront/CartAndCheckoutSection";
import { OrderResultSection } from "@/components/storefront/OrderResultSection";
import { Locale, t } from "@/lib/i18n";
import { convertMinor, formatMinorMoney, getFxTable } from "@/lib/currency";
import { getPreferredLocale, setPreferredLocale } from "@/lib/locale";
import { resolveStorefrontTheme } from "@/lib/storefront-theme";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_amount_minor: number;
  currency_code: string;
};

type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_amount_minor?: number;
  line_total_amount_minor: number;
  options: Array<{ option_value_id: string }>;
};

function formatMoney(locale: Locale, minor: number | undefined, currencyCode: string | undefined): string {
  return formatMinorMoney(
    Number(minor || 0),
    String(currencyCode || "SAR"),
    locale === "ar" ? "ar-SA" : "en-US",
  );
}

function key(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function StorefrontPage() {
  return <StorefrontScreen />;
}

export function StorefrontScreen({ previewToken }: { previewToken?: string }) {
  const [loading, setLoading] = useState(true);

  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [sections, setSections] = useState<Array<Record<string, unknown>>>([]);
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Record<string, unknown> | null>(null);
  const [selectedOptionValueIds, setSelectedOptionValueIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState<Record<string, unknown> | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [orderResult, setOrderResult] = useState<Record<string, unknown> | null>(null);

  const [customer, setCustomer] = useState({ full_name: "", email: "", phone: "" });
  const [shipping, setShipping] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_address_line1: "",
    shipping_city: "",
    shipping_country_code: "SA",
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale("en"));
  const [rtl, setRtl] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("SAR");
  const [activeTheme, setActiveTheme] = useState<Record<string, unknown> | null>(null);
  const previewHeaderToken = previewToken || undefined;

  const cartItems = useMemo(() => ((cart?.items as CartItem[] | undefined) || []), [cart]);
  const words = t(locale).storefront;
  const toast = words.toast;
  const isPreview = Boolean(previewHeaderToken);
  const fx = useMemo(() => getFxTable(String(store?.default_currency || "SAR")), [store]);
  const theme = useMemo(() => resolveStorefrontTheme(store, activeTheme), [store, activeTheme]);
  const themeName = String(activeTheme?.name || activeTheme?.code || "classic");
  const amount = (minor: number | undefined, currencyCode: string | undefined) => {
    const rawMinor = Number(minor || 0);
    const sourceCurrency = String(currencyCode || preferredCurrency || "SAR").toUpperCase();
    const targetCurrency = preferredCurrency.toUpperCase();
    const convertedMinor = convertMinor(rawMinor, sourceCurrency, targetCurrency, fx);
    if (convertedMinor === null) {
      return formatMoney(locale, rawMinor, sourceCurrency);
    }
    return formatMoney(locale, convertedMinor, targetCurrency);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [storeRes, sectionRes, categoryRes, productsRes] = await Promise.all([
          publicApi.store(previewHeaderToken),
          publicApi.sections("home", previewHeaderToken),
          publicApi.categories(previewHeaderToken),
          publicApi.products("", "", previewHeaderToken),
        ]);
        setStore(storeRes);
        setSections(sectionRes.items || []);
        setCategories(categoryRes.items || []);
        setProducts((productsRes.items || []) as Product[]);
        setActiveTheme((storeRes.active_theme as Record<string, unknown> | undefined) || null);

        if (isPreview) {
          setCart({
            token: "preview-local",
            currency_code: String(storeRes.default_currency || "SAR"),
            items: [],
            status: "active",
          });
        } else {
          await analyticsApi.ingestPublicEvent({ event_name: "page_view", source: "storefront" });
        }
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : isPreview ? toast.invalidPreviewToken : toast.failedLoadStorefront);
      } finally {
        setLoading(false);
      }
    })();
  }, [previewHeaderToken]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    setPreferredLocale(locale);
  }, [locale]);

  useEffect(() => {
    if (isPreview) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await publicApi.products(search.trim(), categoryId, previewHeaderToken);
        setProducts((res.items || []) as Product[]);
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : toast.failedRefreshProducts);
      } finally {
        setLoading(false);
      }
    })();
    // search trigger remains explicit via Search button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, isPreview, previewHeaderToken]);

  function pushToast(tone: Toast["tone"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  async function searchProducts() {
    setLoading(true);
    try {
      const q = search.trim();
      const res = await publicApi.products(q, categoryId, previewHeaderToken);
      setProducts((res.items || []) as Product[]);
      if (!isPreview && q) {
        await analyticsApi.ingestPublicEvent({ event_name: "search", source: "storefront", search_query: q });
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.searchFailed);
    } finally {
      setLoading(false);
    }
  }

  function computeOptionDeltaMinor(productId: string, optionValueIds: string[]): number {
    if (!selectedProduct || String(selectedProduct.id) !== productId) return 0;
    const options = ((selectedProduct.options as Array<Record<string, unknown>> | undefined) || []).flatMap((opt) =>
      ((opt.values as Array<Record<string, unknown>> | undefined) || []),
    );
    const selected = options.filter((v) => optionValueIds.includes(String(v.id)));
    return selected.reduce((sum, v) => sum + Number(v.price_delta_minor || 0), 0);
  }

  function validateConfiguratorSelection(): string | null {
    if (!selectedProduct) return null;
    const options = (selectedProduct.options as Array<Record<string, unknown>> | undefined) || [];

    for (const option of options) {
      const valueIds = ((option.values as Array<Record<string, unknown>> | undefined) || []).map((value) => String(value.id));
      const selectedCount = selectedOptionValueIds.filter((id) => valueIds.includes(id)).length;
      const optionName = String(option.name || "option");
      const required = Boolean(option.is_required);
      const minRaw = Number(option.min_select);
      const maxRaw = Number(option.max_select);
      const minSelect = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 0;
      const maxSelect = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null;
      const selectionType = String(option.selection_type || "single");

      if (required && selectedCount === 0) {
        return `${toast.optionSelectionRequired} ${optionName}.`;
      }
      if (minSelect > 0 && selectedCount < minSelect) {
        return `${toast.optionSelectAtLeast} ${minSelect} ${toast.optionFor} ${optionName}.`;
      }
      if (selectionType === "single" && selectedCount > 1) {
        return `${toast.optionSelectAtMost} 1 ${toast.optionFor} ${optionName}.`;
      }
      if (maxSelect !== null && selectedCount > maxSelect) {
        return `${toast.optionSelectAtMost} ${maxSelect} ${toast.optionFor} ${optionName}.`;
      }
    }

    return null;
  }

  function upsertPreviewCartItem(productId: string, qty: number, optionValueIds: string[]) {
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error(toast.selectProductFirst);
    const unit = Number(product.price_amount_minor || 0) + computeOptionDeltaMinor(productId, optionValueIds);
    const normalizedOptions = [...optionValueIds].sort();

    const currentItems = ((cart?.items as CartItem[] | undefined) || []).slice();
    const existingIndex = currentItems.findIndex((it) => {
      const itemOptions = (it.options || []).map((o) => String(o.option_value_id)).sort();
      return it.product_id === productId && JSON.stringify(itemOptions) === JSON.stringify(normalizedOptions);
    });

    if (existingIndex >= 0) {
      const current = currentItems[existingIndex];
      const nextQty = Math.max(1, Number(current.quantity || 0) + qty);
      currentItems[existingIndex] = {
        ...current,
        quantity: nextQty,
        unit_price_amount_minor: unit,
        line_total_amount_minor: unit * nextQty,
      };
    } else {
      currentItems.push({
        id: key("pci"),
        product_id: productId,
        quantity: Math.max(1, qty),
        unit_price_amount_minor: unit,
        line_total_amount_minor: unit * Math.max(1, qty),
        options: normalizedOptions.map((id) => ({ option_value_id: id })),
      });
    }

    setCart({
      token: "preview-local",
      status: "active",
      currency_code: String(store?.default_currency || product.currency_code || "SAR"),
      items: currentItems,
      subtotal_amount_minor: currentItems.reduce((sum, item) => sum + Number(item.line_total_amount_minor || 0), 0),
    });
  }

  function previewSubtotalMinor(): number {
    return cartItems.reduce((sum, item) => sum + Number(item.line_total_amount_minor || 0), 0);
  }

  async function updateCartItem(itemId: string, nextQuantity: number) {
    if (isPreview) {
      const currentItems = ((cart?.items as CartItem[] | undefined) || []).slice();
      const idx = currentItems.findIndex((item) => item.id === itemId);
      if (idx < 0) return;
      const unit = Number(currentItems[idx].unit_price_amount_minor || 0) || Math.floor(Number(currentItems[idx].line_total_amount_minor || 0) / Math.max(1, currentItems[idx].quantity));
      const qty = Math.max(1, nextQuantity);
      currentItems[idx] = { ...currentItems[idx], quantity: qty, line_total_amount_minor: unit * qty, unit_price_amount_minor: unit };
      setCart({
        token: "preview-local",
        status: "active",
        currency_code: String(cart?.currency_code || store?.default_currency || "SAR"),
        items: currentItems,
        subtotal_amount_minor: currentItems.reduce((sum, item) => sum + Number(item.line_total_amount_minor || 0), 0),
      });
      pushToast("success", toast.cartItemUpdated);
      return;
    }
    if (!cart?.token) return;
    setLoading(true);
    try {
      await publicApi.updateCartItem(cart.token as string, itemId, { quantity: Math.max(1, nextQuantity) }, previewHeaderToken);
      setCart(await publicApi.cart(cart.token as string, previewHeaderToken));
      pushToast("success", toast.cartItemUpdated);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedUpdateCartItem);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCartItem(itemId: string) {
    if (isPreview) {
      const currentItems = ((cart?.items as CartItem[] | undefined) || []).filter((item) => item.id !== itemId);
      setCart({
        token: "preview-local",
        status: "active",
        currency_code: String(cart?.currency_code || store?.default_currency || "SAR"),
        items: currentItems,
        subtotal_amount_minor: currentItems.reduce((sum, item) => sum + Number(item.line_total_amount_minor || 0), 0),
      });
      pushToast("success", toast.cartItemRemoved);
      return;
    }
    if (!cart?.token) return;
    setLoading(true);
    try {
      await publicApi.deleteCartItem(cart.token as string, itemId, previewHeaderToken);
      setCart(await publicApi.cart(cart.token as string, previewHeaderToken));
      pushToast("success", toast.cartItemRemoved);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedRemoveCartItem);
    } finally {
      setLoading(false);
    }
  }

  function getProductName(productId: string): string {
    const inList = products.find((p) => p.id === productId);
    return inList?.name || `Product ${productId}`;
  }

  async function loadProduct(slug: string) {
    setLoading(true);
    try {
      const detail = await publicApi.product(slug, previewHeaderToken);
      setSelectedProduct(detail);
      setSelectedOptionValueIds([]);
      setQuantity(1);
      if (!isPreview) {
        await analyticsApi.ingestPublicEvent({ event_name: "product_view", product_id: detail.id, source: "storefront" });
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.productLoadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function ensureCartToken(): Promise<string> {
    if (isPreview) {
      if (!cart?.token) {
        setCart({
          token: "preview-local",
          status: "active",
          currency_code: String(store?.default_currency || "SAR"),
          items: [],
          subtotal_amount_minor: 0,
        });
      }
      return "preview-local";
    }
    if (cart?.token) return cart.token as string;
    const created = await publicApi.createCart({}, previewHeaderToken);
    setCart(created);
    return created.token as string;
  }

  async function addToCart() {
    if (!selectedProduct?.id) {
      pushToast("error", toast.selectProductFirst);
      return;
    }
    if (quantity < 1) {
      pushToast("error", toast.quantityAtLeastOne);
      return;
    }
    const selectionError = validateConfiguratorSelection();
    if (selectionError) {
      pushToast("error", selectionError);
      return;
    }

    setLoading(true);
    try {
      if (isPreview) {
        await ensureCartToken();
        upsertPreviewCartItem(String(selectedProduct.id), quantity, selectedOptionValueIds);
      } else {
        const token = await ensureCartToken();
        await publicApi.addCartItem(token, {
          product_id: selectedProduct.id,
          quantity,
          option_value_ids: selectedOptionValueIds,
        }, previewHeaderToken);
        setCart(await publicApi.cart(token, previewHeaderToken));
      }
      pushToast("success", toast.addedToCart);
      if (!isPreview) {
        await analyticsApi.ingestPublicEvent({ event_name: "add_to_cart", source: "storefront", product_id: selectedProduct.id });
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedAddToCart);
    } finally {
      setLoading(false);
    }
  }

  async function getQuote() {
    if (!cart?.token) {
      pushToast("error", toast.createCartFirst);
      return;
    }
    if (cartItems.length === 0) {
      pushToast("error", toast.cartIsEmpty);
      return;
    }

    setLoading(true);
    try {
      if (isPreview) {
        const subtotal = previewSubtotalMinor();
        const discountAmount = discountCode.trim() ? Math.floor(subtotal * 0.1) : 0;
        const shippingAmount = 0;
        const taxAmount = 0;
        const total = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);
        setQuote({
          preview: true,
          currency_code: String(cart.currency_code || store?.default_currency || "SAR"),
          subtotal_amount_minor: subtotal,
          discount_amount_minor: discountAmount,
          shipping_amount_minor: shippingAmount,
          tax_amount_minor: taxAmount,
          total_amount_minor: total,
        });
      } else {
        const q = await publicApi.applyDiscount(cart.token as string, {
          discount_code: discountCode || undefined,
          shipping: { shipping_country_code: shipping.shipping_country_code },
        }, previewHeaderToken);
        setQuote(q);
        await analyticsApi.ingestPublicEvent({ event_name: "checkout_started", source: "storefront" });
      }
      pushToast("success", toast.quoteCalculated);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.quoteFailed);
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    if (!cart?.token || cartItems.length === 0) {
      pushToast("error", toast.cartIsEmpty);
      return;
    }
    if (!customer.email && !customer.phone) {
      pushToast("error", toast.provideEmailOrPhone);
      return;
    }
    if (!shipping.shipping_address_line1 || !shipping.shipping_city) {
      pushToast("error", toast.shippingAddressRequired);
      return;
    }

    setLoading(true);
    try {
      let result: Record<string, unknown>;
      if (isPreview) {
        const subtotal = previewSubtotalMinor();
        const discountAmount = quote ? Number(quote.discount_amount_minor || 0) : (discountCode.trim() ? Math.floor(subtotal * 0.1) : 0);
        const shippingAmount = quote ? Number(quote.shipping_amount_minor || 0) : 0;
        const total = Math.max(0, subtotal - discountAmount + shippingAmount);
        const orderNumber = `PREVIEW-${String(Date.now()).slice(-6)}`;
        const whatsappNumber = String(store?.whatsapp_number || "").replace(/\D+/g, "");
        const message = encodeURIComponent(`Preview order ${orderNumber}\nTotal: ${total / 100} ${String(cart.currency_code || "SAR")}`);
        result = {
          preview: true,
          order_number: orderNumber,
          subtotal_amount_minor: subtotal,
          discount_amount_minor: discountAmount,
          shipping_amount_minor: shippingAmount,
          tax_amount_minor: 0,
          total_amount_minor: total,
          currency_code: String(cart.currency_code || store?.default_currency || "SAR"),
          status: "simulated",
          whatsapp_url: whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${message}` : undefined,
        };
      } else {
        result = await publicApi.checkoutCart(
          cart.token as string,
          {
            customer,
            shipping,
            discount_code: discountCode || undefined,
            notes: "checkout from storefront",
          },
          key("checkout"),
          previewHeaderToken,
        );
      }
      setOrderResult(result);
      setQuote(null);
      if (isPreview) {
        setCart({
          token: "preview-local",
          status: "active",
          currency_code: String(cart.currency_code || store?.default_currency || "SAR"),
          items: [],
          subtotal_amount_minor: 0,
        });
      } else {
        setCart(await publicApi.createCart({}, previewHeaderToken));
      }
      pushToast("success", toast.orderPlaced);
      if (!isPreview) {
        await analyticsApi.ingestPublicEvent({ event_name: "order_created", source: "storefront" });
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.checkoutFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-8 sm:px-8" dir={rtl ? "rtl" : "ltr"} data-theme={theme.themeKey} style={theme.style}>
      <ToastStack toasts={toasts} />
      <div className="mx-auto max-w-7xl space-y-6">
            <HeaderSection labels={words} />

        {loading ? (
          <Card>
            <Skeleton className="h-6 w-52" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ) : null}

        {!loading ? (
          <StoreAndSearchSection
            store={store}
            sections={sections}
            categories={categories}
            labels={words}
            search={search}
            setSearch={setSearch}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            locale={locale}
            setLocale={setLocale}
            rtl={rtl}
            setRtl={setRtl}
            preferredCurrency={preferredCurrency}
            setPreferredCurrency={setPreferredCurrency}
            directionLabel={words.direction}
            currencyPlaceholder={words.currencyPlaceholder}
            searchProducts={searchProducts}
            isPreview={isPreview}
            themeName={themeName}
            themeVariant={theme.themeVariant}
          />
        ) : null}

        {!loading ? (
          <ProductsAndConfiguratorSection
            products={products}
            labels={words}
            selectedProduct={selectedProduct}
            selectedOptionValueIds={selectedOptionValueIds}
            setSelectedOptionValueIds={setSelectedOptionValueIds}
            quantity={quantity}
            setQuantity={setQuantity}
            loadProduct={loadProduct}
            addToCart={addToCart}
            amount={amount}
            themeVariant={theme.themeVariant}
          />
        ) : null}

        {!loading ? (
          <CartAndCheckoutSection
            cart={cart}
            cartItems={cartItems}
            labels={words}
            discountCode={discountCode}
            setDiscountCode={setDiscountCode}
            quote={quote}
            getQuote={getQuote}
            updateCartItem={updateCartItem}
            deleteCartItem={deleteCartItem}
            getProductName={getProductName}
            customer={customer}
            setCustomer={setCustomer}
            shipping={shipping}
            setShipping={setShipping}
            checkout={checkout}
            amount={amount}
            themeVariant={theme.themeVariant}
          />
        ) : null}

        {orderResult ? <OrderResultSection orderResult={orderResult} labels={words} amount={amount} /> : null}
      </div>
    </main>
  );
}
