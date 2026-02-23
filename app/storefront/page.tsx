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
  const [locale, setLocale] = useState<Locale>("en");
  const [rtl, setRtl] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("SAR");

  const cartItems = useMemo(() => ((cart?.items as CartItem[] | undefined) || []), [cart]);
  const words = t(locale).storefront;
  const toast = words.toast;
  const fx = useMemo(() => getFxTable(String(store?.default_currency || "SAR")), [store]);
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
        const [storeRes, sectionRes, categoryRes, productsRes] = await Promise.all([publicApi.store(), publicApi.sections("home"), publicApi.categories(), publicApi.products()]);
        setStore(storeRes);
        setSections(sectionRes.items || []);
        setCategories(categoryRes.items || []);
        setProducts((productsRes.items || []) as Product[]);
        await analyticsApi.ingestPublicEvent({ event_name: "page_view", source: "storefront" });
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : toast.failedLoadStorefront);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await publicApi.products(search.trim(), categoryId);
        setProducts((res.items || []) as Product[]);
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : toast.failedRefreshProducts);
      } finally {
        setLoading(false);
      }
    })();
    // search trigger remains explicit via Search button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  function pushToast(tone: Toast["tone"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  async function searchProducts() {
    setLoading(true);
    try {
      const q = search.trim();
      const res = await publicApi.products(q, categoryId);
      setProducts((res.items || []) as Product[]);
      if (q) {
        await analyticsApi.ingestPublicEvent({ event_name: "search", source: "storefront", search_query: q });
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.searchFailed);
    } finally {
      setLoading(false);
    }
  }

  async function updateCartItem(itemId: string, nextQuantity: number) {
    if (!cart?.token) return;
    setLoading(true);
    try {
      await publicApi.updateCartItem(cart.token as string, itemId, { quantity: Math.max(1, nextQuantity) });
      setCart(await publicApi.cart(cart.token as string));
      pushToast("success", toast.cartItemUpdated);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedUpdateCartItem);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCartItem(itemId: string) {
    if (!cart?.token) return;
    setLoading(true);
    try {
      await publicApi.deleteCartItem(cart.token as string, itemId);
      setCart(await publicApi.cart(cart.token as string));
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
      const detail = await publicApi.product(slug);
      setSelectedProduct(detail);
      setSelectedOptionValueIds([]);
      setQuantity(1);
      await analyticsApi.ingestPublicEvent({ event_name: "product_view", product_id: detail.id, source: "storefront" });
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.productLoadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function ensureCartToken(): Promise<string> {
    if (cart?.token) return cart.token as string;
    const created = await publicApi.createCart();
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

    setLoading(true);
    try {
      const token = await ensureCartToken();
      await publicApi.addCartItem(token, {
        product_id: selectedProduct.id,
        quantity,
        option_value_ids: selectedOptionValueIds,
      });
      setCart(await publicApi.cart(token));
      pushToast("success", toast.addedToCart);
      await analyticsApi.ingestPublicEvent({ event_name: "add_to_cart", source: "storefront", product_id: selectedProduct.id });
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

    setLoading(true);
    try {
      const q = await publicApi.applyDiscount(cart.token as string, {
        discount_code: discountCode || undefined,
        shipping: { shipping_country_code: shipping.shipping_country_code },
      });
      setQuote(q);
      pushToast("success", toast.quoteCalculated);
      await analyticsApi.ingestPublicEvent({ event_name: "checkout_started", source: "storefront" });
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
      const result = await publicApi.checkoutCart(
        cart.token as string,
        {
          customer,
          shipping,
          discount_code: discountCode || undefined,
          notes: "checkout from storefront",
        },
        key("checkout"),
      );
      setOrderResult(result);
      setQuote(null);
      setCart(await publicApi.createCart());
      pushToast("success", toast.orderPlaced);
      await analyticsApi.ingestPublicEvent({ event_name: "order_created", source: "storefront" });
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.checkoutFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-8 sm:px-8" dir={rtl ? "rtl" : "ltr"}>
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
            searchProducts={searchProducts}
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
          />
        ) : null}

        {orderResult ? <OrderResultSection orderResult={orderResult} labels={words} amount={amount} /> : null}
      </div>
    </main>
  );
}
