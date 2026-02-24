"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  analyticsApi,
  authApi,
  billingApi,
  catalogApi,
  contentApi,
  customersApi,
  integrationsApi,
  notificationsApi,
  ordersApi,
  storesApi,
  StoreMembership,
} from "@/lib/api";
import { clearStoredSession, getStoredSession, SessionState, withAutoRefresh } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast, ToastStack } from "@/components/ui/ToastStack";
import { TabKey } from "@/components/dashboard/types";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { CatalogTab } from "@/components/dashboard/CatalogTab";
import { OrdersTab } from "@/components/dashboard/OrdersTab";
import { CustomersTab } from "@/components/dashboard/CustomersTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { IntegrationsTab } from "@/components/dashboard/IntegrationsTab";
import { Locale, t } from "@/lib/i18n";
import { formatMinorMoney } from "@/lib/currency";
import { getPreferredLocale, setPreferredLocale } from "@/lib/locale";

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default function DashboardPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale("en"));

  const [tab, setTab] = useState<TabKey>("overview");
  const [session, setSession] = useState<SessionState>({ access: "", refresh: "" });
  const [stores, setStores] = useState<StoreMembership[]>([]);
  const [storeId, setStoreId] = useState("");

  const [loading, setLoading] = useState(true);

  const [storeInfo, setStoreInfo] = useState<Record<string, unknown> | null>(null);
  const [storeSettings, setStoreSettings] = useState<Record<string, unknown> | null>(null);
  const [onboarding, setOnboarding] = useState<Record<string, unknown> | null>(null);
  const [domains, setDomains] = useState<Array<Record<string, unknown>>>([]);

  const [products, setProducts] = useState<Array<Record<string, unknown>>>([]);
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [discounts, setDiscounts] = useState<Array<Record<string, unknown>>>([]);
  const [shippingRules, setShippingRules] = useState<Array<Record<string, unknown>>>([]);

  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [orderEvents, setOrderEvents] = useState<Array<Record<string, unknown>>>([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [activeOrderNumber, setActiveOrderNumber] = useState("");

  const [customers, setCustomers] = useState<Array<Record<string, unknown>>>([]);
  const [customerAddresses, setCustomerAddresses] = useState<Array<Record<string, unknown>>>([]);

  const [analyticsOverview, setAnalyticsOverview] = useState<Record<string, unknown> | null>(null);
  const [topProducts, setTopProducts] = useState<Array<Record<string, unknown>>>([]);
  const [searchQueries, setSearchQueries] = useState<Array<Record<string, unknown>>>([]);
  const [ordersTimeseries, setOrdersTimeseries] = useState<Array<Record<string, unknown>>>([]);
  const [emailSummary, setEmailSummary] = useState<Record<string, unknown> | null>(null);

  const [sections, setSections] = useState<Array<Record<string, unknown>>>([]);
  const [themes, setThemes] = useState<Array<Record<string, unknown>>>([]);

  const [emailEvents, setEmailEvents] = useState<Array<Record<string, unknown>>>([]);
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [webhooks, setWebhooks] = useState<Array<Record<string, unknown>>>([]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [newProduct, setNewProduct] = useState({ name: "", slug: "", priceMinor: "1000", currency: "SAR" });
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [editProduct, setEditProduct] = useState({ id: "", name: "", slug: "", priceMinor: "0", currency: "SAR", status: "active" });
  const [editCategory, setEditCategory] = useState({ id: "", name: "", slug: "" });
  const [categoryLink, setCategoryLink] = useState({ productId: "", categoryId: "" });
  const [newDomainHost, setNewDomainHost] = useState("");
  const [newOption, setNewOption] = useState({ productId: "", name: "", optionKind: "variant", selectionType: "single" });
  const [newOptionValue, setNewOptionValue] = useState({ productId: "", optionId: "", label: "", priceDeltaMinor: "0" });
  const [newDiscount, setNewDiscount] = useState({ code: "", type: "percentage", valueMinor: "10", currencyCode: "SAR" });
  const [newShippingRule, setNewShippingRule] = useState({ name: "", type: "flat", amountMinor: "0", currencyCode: "SAR", countryCode: "SA" });
  const [newSection, setNewSection] = useState({ pageKey: "home", sectionType: "hero", title: "", subtitle: "", position: "0" });
  const [editDiscount, setEditDiscount] = useState({ id: "", code: "", type: "percentage", valueMinor: "0", currencyCode: "SAR" });
  const [editShippingRule, setEditShippingRule] = useState({ id: "", name: "", type: "flat", amountMinor: "0", currencyCode: "SAR", countryCode: "SA" });
  const [editSection, setEditSection] = useState({ id: "", title: "", subtitle: "", position: "0" });

  const [settingsDraft, setSettingsDraft] = useState({ seoTitle: "", seoDescription: "" });
  const [onboardingStep, setOnboardingStep] = useState("brand");
  const [orderAction, setOrderAction] = useState({ orderId: "", status: "confirmed", paymentStatus: "paid" });
  const [addressDraft, setAddressDraft] = useState({ customerId: "", addressLine1: "", city: "", countryCode: "SA" });
  const [addressEdit, setAddressEdit] = useState({ id: "", addressLine1: "", city: "", countryCode: "SA" });
  const [webhookDraft, setWebhookDraft] = useState({ name: "", url: "", events: "order.created" });
  const [webhookEdit, setWebhookEdit] = useState({ id: "", name: "", url: "", events: "" });
  const words = t(locale).dashboard;
  const form = words.form;
  const toast = words.toast;
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: words.tabs.overview },
    { key: "store", label: words.tabs.store },
    { key: "catalog", label: words.tabs.catalog },
    { key: "orders", label: words.tabs.orders },
    { key: "customers", label: words.tabs.customers },
    { key: "analytics", label: words.tabs.analytics },
    { key: "integrations", label: words.tabs.integrations },
    { key: "ops", label: words.tabs.ops },
  ];
  const money = (minor: unknown, code: unknown): string =>
    formatMinorMoney(Number(minor || 0), asText(code) || "SAR", locale === "ar" ? "ar-SA" : "en-US");

  // `loadStoreData` intentionally excluded to avoid re-running bootstrap after every render.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const stored = getStoredSession();
    void (async () => {
      setSession(stored);
      setLoading(true);
      try {
        const storeRes = await withAutoRefresh(stored, setSession, (token) => authApi.meStores(token || undefined));
        setStores(storeRes.stores);
        if (!storeRes.stores.length) {
          setStoreId("");
          pushToast("info", toast.noStoresAssigned);
          return;
        }
        const first = storeRes.stores[0].store_id;
        setStoreId(first);
        await loadStoreData(first, stored);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          setSession({ access: "", refresh: "" });
          router.replace("/login");
          return;
        }
        pushToast("error", err instanceof Error ? err.message : toast.failedBootstrap);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);
  /* eslint-enable react-hooks/exhaustive-deps */

  function pushToast(tone: Toast["tone"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  }

  async function runWithSession<T>(fn: (token: string) => Promise<T>): Promise<T> {
    try {
      return await withAutoRefresh(session, setSession, fn);
    } catch (err) {
      clearStoredSession();
      setSession({ access: "", refresh: "" });
      router.replace("/login");
      throw err;
    }
  }

  async function loadStoreData(selectedStoreId: string, currentSession = session) {
    if (!selectedStoreId) return;
    setLoading(true);
    try {
      const [
        storeRes,
        settingsRes,
        onboardingRes,
        domainsRes,
        productsRes,
        categoriesRes,
        discountsRes,
        shippingRes,
        ordersRes,
        customersRes,
        overviewRes,
        topRes,
        searchRes,
        ordersTimeseriesRes,
        emailSummaryRes,
        sectionsRes,
        themesRes,
        emailRes,
        subRes,
        hooksRes,
      ] = await Promise.all([
        withAutoRefresh(currentSession, setSession, (token) => storesApi.getStore(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => storesApi.getSettings(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => storesApi.getOnboarding(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => storesApi.listDomains(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => catalogApi.listProducts(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => catalogApi.listCategories(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => catalogApi.listDiscounts(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => catalogApi.listShippingRules(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => ordersApi.list(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => customersApi.list(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => analyticsApi.overview(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => analyticsApi.topProducts(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => analyticsApi.searchQueries(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => analyticsApi.ordersTimeseries(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => analyticsApi.emailSummary(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => contentApi.listSections(token, selectedStoreId, "home")),
        withAutoRefresh(currentSession, setSession, (token) => contentApi.listThemes(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => notificationsApi.listEmailEvents(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => billingApi.getSubscription(token, selectedStoreId)),
        withAutoRefresh(currentSession, setSession, (token) => integrationsApi.listWebhooks(token, selectedStoreId)),
      ]);

      setStoreInfo(storeRes);
      setStoreSettings(settingsRes);
      setOnboarding(onboardingRes);
      setDomains(domainsRes.items || []);

      setProducts(productsRes.items || []);
      setCategories(categoriesRes.items || []);
      setDiscounts(discountsRes.items || []);
      setShippingRules(shippingRes.items || []);

      setOrders(ordersRes.items || []);
      setCustomers(customersRes.items || []);

      setAnalyticsOverview(overviewRes);
      setTopProducts(topRes.items || []);
      setSearchQueries(searchRes.items || []);
      setOrdersTimeseries(ordersTimeseriesRes.items || []);
      setEmailSummary(emailSummaryRes);

      setSections(sectionsRes.items || []);
      setThemes(themesRes.items || []);
      setEmailEvents(emailRes.items || []);
      setSubscription(subRes);
      setWebhooks(hooksRes.items || []);

      setSettingsDraft({ seoTitle: asText(settingsRes.seo_title), seoDescription: asText(settingsRes.seo_description) });

      if (ordersRes.items?.length) {
        setOrderAction((prev) => ({ ...prev, orderId: asText(ordersRes.items[0].id) }));
      }
      if (customersRes.items?.length) {
        setAddressDraft((prev) => ({ ...prev, customerId: asText(customersRes.items[0].id) }));
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedSyncStore);
    } finally {
      setLoading(false);
    }
  }

  async function onCreateProduct() {
    if (!storeId || !newProduct.name.trim() || !newProduct.slug.trim()) {
      pushToast("error", toast.productNameSlugRequired);
      return;
    }
    await runWithSession((token) =>
      catalogApi.createProduct(token, storeId, {
        name: newProduct.name.trim(),
        slug: newProduct.slug.trim(),
        product_type: "physical",
        status: "active",
        inventory_mode: "product",
        base_price_amount_minor: Number(newProduct.priceMinor),
        currency_code: newProduct.currency.trim().toUpperCase(),
        track_inventory: false,
        stock_qty: null,
        allow_backorder: false,
        requires_shipping: true,
      }),
    );
    setNewProduct({ name: "", slug: "", priceMinor: "1000", currency: "SAR" });
    pushToast("success", toast.productCreated);
    await loadStoreData(storeId);
  }

  async function onDeleteProduct(productId: string) {
    if (!storeId) return;
    await runWithSession((token) => catalogApi.deleteProduct(token, storeId, productId));
    pushToast("success", toast.productDeleted);
    await loadStoreData(storeId);
  }

  async function onUpdateProduct() {
    if (!storeId || !editProduct.id || !editProduct.name.trim() || !editProduct.slug.trim()) return;
    await runWithSession((token) =>
      catalogApi.patchProduct(token, storeId, editProduct.id, {
        name: editProduct.name.trim(),
        slug: editProduct.slug.trim(),
        status: editProduct.status,
        base_price_amount_minor: Number(editProduct.priceMinor || 0),
        currency_code: editProduct.currency.trim().toUpperCase(),
      }),
    );
    pushToast("success", toast.productCreated);
    await loadStoreData(storeId);
  }

  async function onCreateCategory() {
    if (!storeId || !newCategory.name.trim() || !newCategory.slug.trim()) {
      pushToast("error", toast.categoryNameSlugRequired);
      return;
    }
    await runWithSession((token) =>
      catalogApi.createCategory(token, storeId, {
        name: newCategory.name.trim(),
        slug: newCategory.slug.trim(),
        position: 0,
      }),
    );
    setNewCategory({ name: "", slug: "" });
    pushToast("success", toast.categoryCreated);
    await loadStoreData(storeId);
  }

  async function onDeleteCategory(categoryId: string) {
    if (!storeId) return;
    await runWithSession((token) => catalogApi.deleteCategory(token, storeId, categoryId));
    pushToast("success", toast.categoryDeleted);
    await loadStoreData(storeId);
  }

  async function onUpdateCategory() {
    if (!storeId || !editCategory.id || !editCategory.name.trim() || !editCategory.slug.trim()) return;
    await runWithSession((token) =>
      catalogApi.patchCategory(token, storeId, editCategory.id, {
        name: editCategory.name.trim(),
        slug: editCategory.slug.trim(),
      }),
    );
    pushToast("success", toast.categoryCreated);
    await loadStoreData(storeId);
  }

  async function onLinkProductCategory() {
    if (!storeId || !categoryLink.productId || !categoryLink.categoryId) return;
    await runWithSession((token) => catalogApi.linkProductCategory(token, storeId, categoryLink.productId, categoryLink.categoryId));
    pushToast("success", toast.categoryCreated);
    await loadStoreData(storeId);
  }

  async function onUnlinkProductCategory() {
    if (!storeId || !categoryLink.productId || !categoryLink.categoryId) return;
    await runWithSession((token) => catalogApi.unlinkProductCategory(token, storeId, categoryLink.productId, categoryLink.categoryId));
    pushToast("success", toast.categoryDeleted);
    await loadStoreData(storeId);
  }

  async function onCreateDomain(e: FormEvent) {
    e.preventDefault();
    if (!storeId || !newDomainHost.trim()) return;
    await runWithSession((token) => storesApi.createDomain(token, storeId, { host: newDomainHost.trim(), type: "custom" }));
    setNewDomainHost("");
    pushToast("success", toast.domainAdded);
    await loadStoreData(storeId);
  }

  async function onDomainAction(type: "verify" | "primary" | "delete", domainId: string) {
    if (!storeId) return;
    if (type === "verify") await runWithSession((token) => storesApi.verifyDomain(token, storeId, domainId));
    if (type === "primary") await runWithSession((token) => storesApi.makePrimaryDomain(token, storeId, domainId));
    if (type === "delete") await runWithSession((token) => storesApi.deleteDomain(token, storeId, domainId));
    pushToast("success", toast.domainActionDone);
    await refreshDomainStatuses();
  }

  async function refreshDomainStatuses() {
    if (!storeId) return;
    const res = await runWithSession((token) => storesApi.listDomains(token, storeId));
    setDomains(res.items || []);
  }

  async function onPublish(shouldPublish: boolean) {
    if (!storeId) return;
    if (shouldPublish) await runWithSession((token) => storesApi.publish(token, storeId));
    else await runWithSession((token) => storesApi.unpublish(token, storeId));
    pushToast("success", shouldPublish ? toast.storePublished : toast.storeUnpublished);
    await loadStoreData(storeId);
  }

  async function onSaveSettings() {
    if (!storeId) return;
    await runWithSession((token) =>
      storesApi.patchSettings(token, storeId, {
        seo_title: settingsDraft.seoTitle,
        seo_description: settingsDraft.seoDescription,
      }),
    );
    pushToast("success", toast.settingsUpdated);
    await loadStoreData(storeId);
  }

  async function onUpdateOnboarding() {
    if (!storeId) return;
    await runWithSession((token) => storesApi.patchOnboarding(token, storeId, onboardingStep, true));
    pushToast("success", toast.onboardingMarked);
    await loadStoreData(storeId);
  }

  async function onCreateOption() {
    if (!storeId || !newOption.productId || !newOption.name.trim()) {
      pushToast("error", toast.optionSelectProductAndName);
      return;
    }
    await runWithSession((token) =>
      catalogApi.createOption(token, storeId, newOption.productId, {
        name: newOption.name.trim(),
        option_kind: newOption.optionKind,
        selection_type: newOption.selectionType,
      }),
    );
    setNewOption({ productId: "", name: "", optionKind: "variant", selectionType: "single" });
    pushToast("success", toast.optionCreated);
  }

  async function onLoadProductOptions(productId: string) {
    if (!storeId) return;
    const opts = await runWithSession((token) => catalogApi.listOptions(token, storeId, productId));
    const first = opts[0];
    if (first) {
      setNewOptionValue((prev) => ({ ...prev, productId, optionId: asText(first.id) }));
      pushToast("info", `${toast.optionsLoaded} (${opts.length})`);
    } else {
      pushToast("info", toast.noOptionsFound);
    }
  }

  async function onCreateOptionValue() {
    if (!storeId || !newOptionValue.productId || !newOptionValue.optionId || !newOptionValue.label.trim()) {
      pushToast("error", toast.optionValueRequired);
      return;
    }
    await runWithSession((token) =>
      catalogApi.createOptionValue(token, storeId, newOptionValue.productId, newOptionValue.optionId, {
        label: newOptionValue.label.trim(),
        price_delta_minor: Number(newOptionValue.priceDeltaMinor),
      }),
    );
    setNewOptionValue({ productId: "", optionId: "", label: "", priceDeltaMinor: "0" });
    pushToast("success", toast.optionValueCreated);
  }

  async function onCreateDiscount() {
    if (!storeId || !newDiscount.code.trim()) {
      pushToast("error", toast.discountCodeRequired);
      return;
    }
    const tempId = `temp-discount-${Date.now()}`;
    const optimistic = {
      id: tempId,
      code: newDiscount.code.trim(),
      type: newDiscount.type,
      value_minor: Number(newDiscount.valueMinor),
      currency_code: newDiscount.currencyCode,
    };
    setDiscounts((prev) => [optimistic, ...prev]);
    setNewDiscount({ code: "", type: "percentage", valueMinor: "10", currencyCode: "SAR" });
    try {
      const created = await runWithSession((token) =>
        catalogApi.createDiscount(token, storeId, {
          code: optimistic.code,
          type: optimistic.type,
          value_minor: optimistic.value_minor,
          currency_code: optimistic.currency_code,
        }),
      );
      setDiscounts((prev) => prev.map((item) => (asText(item.id) === tempId ? (created as Record<string, unknown>) : item)));
      pushToast("success", toast.discountCreated);
    } catch (err) {
      setDiscounts((prev) => prev.filter((item) => asText(item.id) !== tempId));
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onDeleteDiscount(discountId: string) {
    if (!storeId) return;
    const prev = discounts;
    setDiscounts((list) => list.filter((item) => asText(item.id) !== discountId));
    try {
      await runWithSession((token) => catalogApi.deleteDiscount(token, storeId, discountId));
      pushToast("success", toast.discountDeleted);
    } catch (err) {
      setDiscounts(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onUpdateDiscount() {
    if (!storeId || !editDiscount.id) return;
    const prev = discounts;
    setDiscounts((list) =>
      list.map((item) =>
        asText(item.id) === editDiscount.id
          ? {
              ...item,
              code: editDiscount.code.trim(),
              type: editDiscount.type,
              value_minor: Number(editDiscount.valueMinor),
              currency_code: editDiscount.currencyCode,
            }
          : item,
      ),
    );
    try {
      const updated = await runWithSession((token) =>
        catalogApi.patchDiscount(token, storeId, editDiscount.id, {
          code: editDiscount.code.trim(),
          type: editDiscount.type,
          value_minor: Number(editDiscount.valueMinor),
          currency_code: editDiscount.currencyCode,
        }),
      );
      setDiscounts((list) => list.map((item) => (asText(item.id) === editDiscount.id ? (updated as Record<string, unknown>) : item)));
      pushToast("success", toast.discountUpdated);
    } catch (err) {
      setDiscounts(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onCreateShippingRule() {
    if (!storeId || !newShippingRule.name.trim()) {
      pushToast("error", toast.shippingNameRequired);
      return;
    }
    const tempId = `temp-shipping-${Date.now()}`;
    const optimistic = {
      id: tempId,
      name: newShippingRule.name,
      type: newShippingRule.type,
      amount_minor: Number(newShippingRule.amountMinor),
      currency_code: newShippingRule.currencyCode,
      country_code: newShippingRule.countryCode,
    };
    setShippingRules((prev) => [optimistic, ...prev]);
    setNewShippingRule({ name: "", type: "flat", amountMinor: "0", currencyCode: "SAR", countryCode: "SA" });
    try {
      const created = await runWithSession((token) =>
        catalogApi.createShippingRule(token, storeId, {
          name: optimistic.name,
          type: optimistic.type,
          amount_minor: optimistic.amount_minor,
          currency_code: optimistic.currency_code,
          country_code: optimistic.country_code,
        }),
      );
      setShippingRules((prev) => prev.map((item) => (asText(item.id) === tempId ? (created as Record<string, unknown>) : item)));
      pushToast("success", toast.shippingRuleCreated);
    } catch (err) {
      setShippingRules((prev) => prev.filter((item) => asText(item.id) !== tempId));
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onDeleteShippingRule(ruleId: string) {
    if (!storeId) return;
    const prev = shippingRules;
    setShippingRules((list) => list.filter((item) => asText(item.id) !== ruleId));
    try {
      await runWithSession((token) => catalogApi.deleteShippingRule(token, storeId, ruleId));
      pushToast("success", toast.shippingRuleDeleted);
    } catch (err) {
      setShippingRules(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onUpdateShippingRule() {
    if (!storeId || !editShippingRule.id) return;
    const prev = shippingRules;
    setShippingRules((list) =>
      list.map((item) =>
        asText(item.id) === editShippingRule.id
          ? {
              ...item,
              name: editShippingRule.name,
              type: editShippingRule.type,
              amount_minor: Number(editShippingRule.amountMinor),
              currency_code: editShippingRule.currencyCode,
              country_code: editShippingRule.countryCode,
            }
          : item,
      ),
    );
    try {
      const updated = await runWithSession((token) =>
        catalogApi.patchShippingRule(token, storeId, editShippingRule.id, {
          name: editShippingRule.name,
          type: editShippingRule.type,
          amount_minor: Number(editShippingRule.amountMinor),
          currency_code: editShippingRule.currencyCode,
          country_code: editShippingRule.countryCode,
        }),
      );
      setShippingRules((list) => list.map((item) => (asText(item.id) === editShippingRule.id ? (updated as Record<string, unknown>) : item)));
      pushToast("success", toast.shippingRuleUpdated);
    } catch (err) {
      setShippingRules(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onCreateSection() {
    if (!storeId || !newSection.title.trim()) {
      pushToast("error", toast.sectionTitleRequired);
      return;
    }
    const tempId = `temp-section-${Date.now()}`;
    const optimistic = {
      id: tempId,
      page_key: newSection.pageKey,
      section_type: newSection.sectionType,
      title: newSection.title,
      subtitle: newSection.subtitle,
      position: Number(newSection.position),
    };
    setSections((prev) => [optimistic, ...prev]);
    setNewSection({ pageKey: "home", sectionType: "hero", title: "", subtitle: "", position: "0" });
    try {
      const created = await runWithSession((token) =>
        contentApi.createSection(token, storeId, {
          page_key: optimistic.page_key,
          section_type: optimistic.section_type,
          title: optimistic.title,
          subtitle: optimistic.subtitle,
          position: optimistic.position,
        }),
      );
      setSections((prev) => prev.map((item) => (asText(item.id) === tempId ? (created as Record<string, unknown>) : item)));
      pushToast("success", toast.sectionCreated);
    } catch (err) {
      setSections((prev) => prev.filter((item) => asText(item.id) !== tempId));
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onDeleteSection(sectionId: string) {
    if (!storeId) return;
    const prev = sections;
    setSections((list) => list.filter((item) => asText(item.id) !== sectionId));
    try {
      await runWithSession((token) => contentApi.deleteSection(token, storeId, sectionId));
      pushToast("success", toast.sectionDeleted);
    } catch (err) {
      setSections(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onUpdateSection() {
    if (!storeId || !editSection.id) return;
    const prev = sections;
    setSections((list) =>
      list.map((item) =>
        asText(item.id) === editSection.id
          ? {
              ...item,
              title: editSection.title,
              subtitle: editSection.subtitle,
              position: Number(editSection.position),
            }
          : item,
      ),
    );
    try {
      const updated = await runWithSession((token) =>
        contentApi.patchSection(token, storeId, editSection.id, {
          title: editSection.title,
          subtitle: editSection.subtitle,
          position: Number(editSection.position),
        }),
      );
      setSections((list) => list.map((item) => (asText(item.id) === editSection.id ? (updated as Record<string, unknown>) : item)));
      pushToast("success", toast.sectionUpdated);
    } catch (err) {
      setSections(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onActivateTheme(themeId: string) {
    if (!storeId) return;
    await runWithSession((token) => contentApi.activateTheme(token, storeId, themeId));
    pushToast("success", toast.themeActivated);
    await loadStoreData(storeId);
  }

  async function openOrderEvents(orderId: string, orderNumber: string) {
    if (!storeId) return;
    const res = await runWithSession((token) => ordersApi.events(token, storeId, orderId));
    setOrderEvents(res.items || []);
    setActiveOrderNumber(orderNumber);
    setOrderModalOpen(true);
  }

  async function onUpdateOrder() {
    if (!storeId || !orderAction.orderId) return;
    await runWithSession((token) => ordersApi.updateStatus(token, storeId, orderAction.orderId, orderAction.status));
    await runWithSession((token) => ordersApi.updatePaymentStatus(token, storeId, orderAction.orderId, orderAction.paymentStatus));
    pushToast("success", toast.orderStatusesUpdated);
    await loadStoreData(storeId);
  }

  async function onResendOrderEmail() {
    if (!storeId || !orderAction.orderId) return;
    await runWithSession((token) => ordersApi.resendEmail(token, storeId, orderAction.orderId));
    pushToast("success", toast.resendEmailQueued);
  }

  async function onSendConfirmationEmail() {
    if (!storeId || !orderAction.orderId) return;
    await runWithSession((token) => notificationsApi.sendConfirmation(token, storeId, orderAction.orderId));
    pushToast("success", toast.confirmationEmailAttempted);
    await loadStoreData(storeId);
  }

  async function onGetWhatsappPreview() {
    if (!storeId || !orderAction.orderId) return;
    const res = await runWithSession((token) => notificationsApi.whatsappPreview(token, storeId, orderAction.orderId));
    pushToast("info", res.whatsapp_url || toast.noWhatsAppUrl);
  }

  async function onLoadAddresses(customerId: string) {
    if (!storeId || !customerId) return;
    const res = await runWithSession((token) => customersApi.listAddresses(token, storeId, customerId));
    setCustomerAddresses(res.items || []);
  }

  async function onCreateAddress() {
    if (!storeId || !addressDraft.customerId || !addressDraft.addressLine1.trim()) return;
    const tempId = `temp-address-${Date.now()}`;
    const optimistic = {
      id: tempId,
      address_line1: addressDraft.addressLine1,
      city: addressDraft.city,
      country_code: addressDraft.countryCode,
    };
    setCustomerAddresses((prev) => [optimistic, ...prev]);
    try {
      const created = await runWithSession((token) =>
        customersApi.createAddress(token, storeId, addressDraft.customerId, {
          address_line1: addressDraft.addressLine1,
          city: addressDraft.city,
          country_code: addressDraft.countryCode,
        }),
      );
      setCustomerAddresses((prev) => prev.map((item) => (asText(item.id) === tempId ? (created as Record<string, unknown>) : item)));
      pushToast("success", toast.addressCreated);
    } catch (err) {
      setCustomerAddresses((prev) => prev.filter((item) => asText(item.id) !== tempId));
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onDeleteAddress(addressId: string) {
    if (!storeId || !addressDraft.customerId) return;
    const prev = customerAddresses;
    setCustomerAddresses((list) => list.filter((item) => asText(item.id) !== addressId));
    try {
      await runWithSession((token) => customersApi.deleteAddress(token, storeId, addressDraft.customerId, addressId));
      pushToast("success", toast.addressDeleted);
    } catch (err) {
      setCustomerAddresses(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onUpdateAddress() {
    if (!storeId || !addressDraft.customerId || !addressEdit.id) return;
    const prev = customerAddresses;
    setCustomerAddresses((list) =>
      list.map((item) =>
        asText(item.id) === addressEdit.id
          ? {
              ...item,
              address_line1: addressEdit.addressLine1,
              city: addressEdit.city,
              country_code: addressEdit.countryCode,
            }
          : item,
      ),
    );
    try {
      const updated = await runWithSession((token) =>
        customersApi.patchAddress(token, storeId, addressDraft.customerId, addressEdit.id, {
          address_line1: addressEdit.addressLine1,
          city: addressEdit.city,
          country_code: addressEdit.countryCode,
        }),
      );
      setCustomerAddresses((list) => list.map((item) => (asText(item.id) === addressEdit.id ? (updated as Record<string, unknown>) : item)));
      pushToast("success", toast.addressUpdated);
    } catch (err) {
      setCustomerAddresses(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onCreateWebhook() {
    if (!storeId || !webhookDraft.name.trim() || !webhookDraft.url.trim()) return;
    const tempId = `temp-webhook-${Date.now()}`;
    const optimistic = {
      id: tempId,
      name: webhookDraft.name.trim(),
      url: webhookDraft.url.trim(),
      events: webhookDraft.events.split(",").map((item) => item.trim()).filter(Boolean),
    };
    setWebhooks((prev) => [optimistic, ...prev]);
    setWebhookDraft({ name: "", url: "", events: "order.created" });
    try {
      const created = await runWithSession((token) =>
        integrationsApi.createWebhook(token, storeId, {
          name: optimistic.name,
          url: optimistic.url,
          events: optimistic.events,
        }),
      );
      setWebhooks((prev) => prev.map((item) => (asText(item.id) === tempId ? (created as Record<string, unknown>) : item)));
      pushToast("success", toast.webhookCreated);
    } catch (err) {
      setWebhooks((prev) => prev.filter((item) => asText(item.id) !== tempId));
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onUpdateWebhook() {
    if (!storeId || !webhookEdit.id) return;
    const prev = webhooks;
    setWebhooks((list) =>
      list.map((item) =>
        asText(item.id) === webhookEdit.id
          ? {
              ...item,
              name: webhookEdit.name.trim(),
              url: webhookEdit.url.trim(),
              events: webhookEdit.events.split(",").map((entry) => entry.trim()).filter(Boolean),
            }
          : item,
      ),
    );
    try {
      const updated = await runWithSession((token) =>
        integrationsApi.patchWebhook(token, storeId, webhookEdit.id, {
          name: webhookEdit.name.trim(),
          url: webhookEdit.url.trim(),
          events: webhookEdit.events.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      );
      setWebhooks((list) => list.map((item) => (asText(item.id) === webhookEdit.id ? (updated as Record<string, unknown>) : item)));
      pushToast("success", toast.webhookUpdated);
    } catch (err) {
      setWebhooks(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onDeleteWebhook(webhookId: string) {
    if (!storeId) return;
    const prev = webhooks;
    setWebhooks((list) => list.filter((item) => asText(item.id) !== webhookId));
    try {
      await runWithSession((token) => integrationsApi.deleteWebhook(token, storeId, webhookId));
      pushToast("success", toast.webhookDeleted);
    } catch (err) {
      setWebhooks(prev);
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  async function onTestWebhook(webhookId: string) {
    if (!storeId) return;
    await runWithSession((token) => integrationsApi.testWebhook(token, storeId, webhookId));
    pushToast("success", toast.webhookTestSent);
  }

  async function onMarkPaid() {
    if (!storeId) return;
    await runWithSession((token) => billingApi.markPaid(token, storeId, { amount_minor: 2000, external_ref: `manual-${Date.now()}` }));
    pushToast("success", toast.subscriptionMarkedPaid);
    await loadStoreData(storeId);
  }

  async function onPatchSubscription() {
    if (!storeId) return;
    await runWithSession((token) => billingApi.patchSubscription(token, storeId, { plan_code: "pro" }));
    pushToast("success", toast.subscriptionUpdated);
    await loadStoreData(storeId);
  }

  async function onLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearStoredSession();
    setSession({ access: "", refresh: "" });
    router.replace("/login");
  }

  async function openPreviewStorefront() {
    if (!storeId) {
      router.push("/storefront");
      return;
    }
    try {
      const res = await runWithSession((token) => storesApi.createPreviewToken(token, storeId));
      router.push(`/storefront/preview/${encodeURIComponent(String(res.preview_token || ""))}`);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    }
  }

  const storeName = useMemo(() => stores.find((s) => s.store_id === storeId)?.name || "", [stores, storeId]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (tab !== "store" || !storeId) return;
    const hasPending = domains.some((domain) => asText(domain.verification_status) === "pending");
    if (!hasPending) return;
    const interval = setInterval(() => {
      void refreshDomainStatuses();
    }, 8000);
    return () => clearInterval(interval);
  }, [tab, storeId, domains]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <main className="px-4 py-8 sm:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ToastStack toasts={toasts} />

      <Modal open={orderModalOpen} title={`${words.orderEventsTitle} • ${activeOrderNumber}`} onClose={() => setOrderModalOpen(false)}>
        {orderEvents.length === 0 ? (
          <EmptyState title={words.noEvents} description={words.noEventsDesc} />
        ) : (
          <ul className="space-y-2 text-sm">
            {orderEvents.map((ev) => (
              <li key={asText(ev.id)} className="rounded-xl border border-[#d9ddcf] bg-white p-3">
                <p className="font-semibold">{asText(ev.event_type)}</p>
                <p className="soft code">{JSON.stringify(ev.payload_json)}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="badge badge-info">{words.badge}</p>
              <h1 className="mt-3 text-2xl font-black sm:text-4xl">{words.title}</h1>
              <p className="soft mt-2">{words.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/storefront" className="button button-muted">{words.storefront}</Link>
              <Button variant="muted" onClick={() => void openPreviewStorefront()}>{words.preview}</Button>
              <Link href="/dashboard/onboarding" className="button button-muted">{words.onboarding}</Link>
              <select
                className="select w-auto min-w-20"
                value={locale}
                onChange={(e) => {
                  const next = e.target.value as Locale;
                  setLocale(next);
                  setPreferredLocale(next);
                }}
              >
                <option value="en">EN</option>
                <option value="ar">AR</option>
              </select>
              <Button variant="danger" onClick={onLogout}>{words.logout}</Button>
            </div>
          </div>
        </Card>

        <Card>
          {stores.length ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select className="select" value={storeId} onChange={(e) => { const id = e.target.value; setStoreId(id); void loadStoreData(id); }}>
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>{s.name} ({s.role})</option>
                ))}
              </select>
              <Button variant="muted" onClick={() => void loadStoreData(storeId)}>{words.refresh}</Button>
            </div>
          ) : (
            <EmptyState title={words.noStoresTitle} description={words.noStoresDesc} />
          )}
        </Card>

        <Card>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Button key={t.key} variant={tab === t.key ? "primary" : "muted"} onClick={() => setTab(t.key)}>{t.label}</Button>
            ))}
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ) : null}

        {!loading && tab === "overview" ? (
          <OverviewTab
            storeName={storeName}
            productsCount={products.length}
            ordersCount={orders.length}
            customersCount={customers.length}
            labels={{ store: form.store, products: form.products, orders: form.orders, customers: form.customers }}
          />
        ) : null}

        {!loading && tab === "store" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-bold">{form.storePublish}</h3>
              <p className="soft mt-2 code">{JSON.stringify(storeInfo)}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => void onPublish(true)}>{form.publish}</Button>
                <Button variant="muted" onClick={() => void onPublish(false)}>{form.unpublish}</Button>
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold">{form.settings}</h3>
              <p className="soft mt-2 code">{JSON.stringify(storeSettings)}</p>
              <div className="mt-3 space-y-2">
                <input className="input" placeholder={form.seoTitle} value={settingsDraft.seoTitle} onChange={(e) => setSettingsDraft((s) => ({ ...s, seoTitle: e.target.value }))} />
                <input className="input" placeholder={form.seoDescription} value={settingsDraft.seoDescription} onChange={(e) => setSettingsDraft((s) => ({ ...s, seoDescription: e.target.value }))} />
                <Button onClick={() => void onSaveSettings()}>{form.saveSettings}</Button>
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold">{form.onboardingStatus}</h3>
              <p className="soft mt-2 code">{JSON.stringify(onboarding)}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select className="select" value={onboardingStep} onChange={(e) => setOnboardingStep(e.target.value)}>
                  <option value="brand">brand</option>
                  <option value="seo">seo</option>
                  <option value="first_product">first_product</option>
                  <option value="options">options</option>
                  <option value="sections">sections</option>
                  <option value="preview">preview</option>
                </select>
                <Button onClick={() => void onUpdateOnboarding()}>{form.markCompleted}</Button>
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold">{form.domains}</h3>
              <form className="mt-2 flex gap-2" onSubmit={onCreateDomain}>
                <input className="input" placeholder={form.customDomainPlaceholder} value={newDomainHost} onChange={(e) => setNewDomainHost(e.target.value)} />
                <Button>{form.add}</Button>
              </form>
              <div className="mt-3">
                <Button variant="muted" onClick={() => void refreshDomainStatuses()}>{form.refreshStatuses}</Button>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {domains.map((d) => (
                  <li key={asText(d.id)} className="rounded-lg border border-[#d9ddcf] bg-white p-3">
                    <p className="font-semibold">{asText(d.host)} • {asText(d.verification_status)}</p>
                    <p className="soft mt-1">
                      {form.dnsTarget}: <span className="code">{asText(d.dns_target) || "cname.yourapp.com"}</span>
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="muted" onClick={() => void onDomainAction("verify", asText(d.id))}>{form.verify}</Button>
                      <Button variant="muted" onClick={() => void onDomainAction("primary", asText(d.id))}>{form.makePrimary}</Button>
                      <Button variant="danger" onClick={() => void onDomainAction("delete", asText(d.id))}>{form.delete}</Button>
                    </div>
                    <div className="mt-2 rounded-lg border border-[#e3e7da] bg-[#f8f9f4] p-2">
                      <p className="font-semibold">{form.dnsInstructions}</p>
                      <ol className="mt-1 list-decimal space-y-1 pl-5">
                        <li>{form.dnsStep1}</li>
                        <li>{form.dnsStep2}</li>
                        <li>{form.dnsStep3}</li>
                      </ol>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ) : null}

        {!loading && tab === "catalog" ? (
          <>
            <CatalogTab
              products={products}
              categories={categories}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              onCreateProduct={onCreateProduct}
              editProduct={editProduct}
              setEditProduct={setEditProduct}
              onUpdateProduct={onUpdateProduct}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              onCreateCategory={onCreateCategory}
              editCategory={editCategory}
              setEditCategory={setEditCategory}
              onUpdateCategory={onUpdateCategory}
              categoryLink={categoryLink}
              setCategoryLink={setCategoryLink}
              onLinkProductCategory={onLinkProductCategory}
              onUnlinkProductCategory={onUnlinkProductCategory}
              money={money}
              asText={asText}
              labels={{
                createProduct: form.createProduct,
                createCategory: form.createCategory,
                name: form.name,
                slug: form.slug,
                priceMinor: form.priceMinor,
                currency: form.currency,
                create: form.create,
                productTable: form.productTable,
                noProductsYet: form.noProductsYet,
                createFirstProduct: form.createFirstProduct,
                status: form.status,
                price: form.price,
                update: form.update,
                add: form.add,
                delete: form.delete,
                action: form.action,
                selectProduct: form.selectProduct,
                updateDiscount: form.updateDiscount,
                updateShipping: form.updateShipping,
              }}
            />
            <section className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="text-lg font-bold">{form.deleteProductCategory}</h3>
                <div className="mt-3 space-y-2">
                  {products.slice(0, 5).map((p) => (
                    <div key={asText(p.id)} className="flex items-center justify-between rounded border border-[#d9ddcf] bg-white p-2 text-sm">
                      <span>{asText(p.name)}</span>
                      <Button variant="danger" onClick={() => void onDeleteProduct(asText(p.id))}>{form.delete}</Button>
                    </div>
                  ))}
                  {categories.slice(0, 5).map((c) => (
                    <div key={asText(c.id)} className="flex items-center justify-between rounded border border-[#d9ddcf] bg-white p-2 text-sm">
                      <span>{asText(c.name)}</span>
                      <Button variant="danger" onClick={() => void onDeleteCategory(asText(c.id))}>{form.delete}</Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold">{form.productOptions}</h3>
                <div className="mt-3 space-y-2">
                  <select className="select" value={newOption.productId} onChange={(e) => setNewOption((v) => ({ ...v, productId: e.target.value }))}>
                    <option value="">{form.selectProduct}</option>
                    {products.map((p) => <option key={asText(p.id)} value={asText(p.id)}>{asText(p.name)}</option>)}
                  </select>
                  <input className="input" placeholder={form.optionName} value={newOption.name} onChange={(e) => setNewOption((v) => ({ ...v, name: e.target.value }))} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className="select" value={newOption.optionKind} onChange={(e) => setNewOption((v) => ({ ...v, optionKind: e.target.value }))}>
                      <option value="variant">variant</option><option value="addon">addon</option><option value="input">input</option>
                    </select>
                    <select className="select" value={newOption.selectionType} onChange={(e) => setNewOption((v) => ({ ...v, selectionType: e.target.value }))}>
                      <option value="single">single</option><option value="multiple">multiple</option>
                    </select>
                  </div>
                  <Button onClick={() => void onCreateOption()}>{form.createOption}</Button>
                  <Button variant="muted" onClick={() => void onLoadProductOptions(newOption.productId)}>{form.loadProductOptions}</Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold">{form.optionValues}</h3>
                <div className="mt-3 space-y-2">
                  <input className="input" placeholder={form.productId} value={newOptionValue.productId} onChange={(e) => setNewOptionValue((v) => ({ ...v, productId: e.target.value }))} />
                  <input className="input" placeholder={form.optionId} value={newOptionValue.optionId} onChange={(e) => setNewOptionValue((v) => ({ ...v, optionId: e.target.value }))} />
                  <input className="input" placeholder={form.label} value={newOptionValue.label} onChange={(e) => setNewOptionValue((v) => ({ ...v, label: e.target.value }))} />
                  <input className="input" placeholder={form.priceDeltaMinor} value={newOptionValue.priceDeltaMinor} onChange={(e) => setNewOptionValue((v) => ({ ...v, priceDeltaMinor: e.target.value }))} />
                  <Button onClick={() => void onCreateOptionValue()}>{form.createOptionValue}</Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold">{form.discountsShipping}</h3>
                <div className="mt-3 space-y-2">
                  <input className="input" placeholder={form.discountCode} value={newDiscount.code} onChange={(e) => setNewDiscount((v) => ({ ...v, code: e.target.value }))} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className="select" value={newDiscount.type} onChange={(e) => setNewDiscount((v) => ({ ...v, type: e.target.value }))}>
                      <option value="percentage">percentage</option><option value="fixed">fixed</option>
                    </select>
                    <input className="input" placeholder={form.valueMinor} value={newDiscount.valueMinor} onChange={(e) => setNewDiscount((v) => ({ ...v, valueMinor: e.target.value }))} />
                  </div>
                  <Button onClick={() => void onCreateDiscount()}>{form.createDiscount}</Button>
                  {discounts.slice(0, 3).map((d) => (
                    <div key={asText(d.id)} className="flex items-center justify-between rounded border border-[#d9ddcf] bg-white p-2 text-sm">
                      <span>{asText(d.code)}</span>
                      <Button variant="danger" onClick={() => void onDeleteDiscount(asText(d.id))}>{form.delete}</Button>
                    </div>
                  ))}
                  <div className="rounded border border-[#d9ddcf] p-2">
                    <p className="mb-2 text-sm font-semibold">{form.editDiscount}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className="select" value={editDiscount.id} onChange={(e) => {
                        const found = discounts.find((d) => asText(d.id) === e.target.value);
                        setEditDiscount({
                          id: e.target.value,
                          code: asText(found?.code),
                          type: asText(found?.type) || "percentage",
                          valueMinor: asText(found?.value_minor || 0),
                          currencyCode: asText(found?.currency_code) || "SAR",
                        });
                      }}>
                        <option value="">{form.selectDiscount}</option>
                        {discounts.map((d) => <option key={asText(d.id)} value={asText(d.id)}>{asText(d.code)}</option>)}
                      </select>
                      <input className="input" placeholder={form.discountCode} value={editDiscount.code} onChange={(e) => setEditDiscount((v) => ({ ...v, code: e.target.value }))} />
                      <select className="select" value={editDiscount.type} onChange={(e) => setEditDiscount((v) => ({ ...v, type: e.target.value }))}>
                        <option value="percentage">percentage</option><option value="fixed">fixed</option>
                      </select>
                      <input className="input" placeholder={form.valueMinor} value={editDiscount.valueMinor} onChange={(e) => setEditDiscount((v) => ({ ...v, valueMinor: e.target.value }))} />
                    </div>
                    <Button className="mt-2" variant="muted" onClick={() => void onUpdateDiscount()}>{form.updateDiscount}</Button>
                  </div>

                  <hr className="my-2 border-[#d9ddcf]" />
                  <input className="input" placeholder={form.shippingName} value={newShippingRule.name} onChange={(e) => setNewShippingRule((v) => ({ ...v, name: e.target.value }))} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className="select" value={newShippingRule.type} onChange={(e) => setNewShippingRule((v) => ({ ...v, type: e.target.value }))}>
                      <option value="flat">flat</option><option value="free">free</option><option value="threshold">threshold</option>
                    </select>
                    <input className="input" placeholder={form.amountMinor} value={newShippingRule.amountMinor} onChange={(e) => setNewShippingRule((v) => ({ ...v, amountMinor: e.target.value }))} />
                  </div>
                  <Button onClick={() => void onCreateShippingRule()}>{form.createShippingRule}</Button>
                  {shippingRules.slice(0, 3).map((r) => (
                    <div key={asText(r.id)} className="flex items-center justify-between rounded border border-[#d9ddcf] bg-white p-2 text-sm">
                      <span>{asText(r.name)}</span>
                      <Button variant="danger" onClick={() => void onDeleteShippingRule(asText(r.id))}>{form.delete}</Button>
                    </div>
                  ))}
                  <div className="rounded border border-[#d9ddcf] p-2">
                    <p className="mb-2 text-sm font-semibold">{form.editShippingRule}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className="select" value={editShippingRule.id} onChange={(e) => {
                        const found = shippingRules.find((r) => asText(r.id) === e.target.value);
                        setEditShippingRule({
                          id: e.target.value,
                          name: asText(found?.name),
                          type: asText(found?.type) || "flat",
                          amountMinor: asText(found?.amount_minor || 0),
                          currencyCode: asText(found?.currency_code) || "SAR",
                          countryCode: asText(found?.country_code) || "SA",
                        });
                      }}>
                        <option value="">{form.selectRule}</option>
                        {shippingRules.map((r) => <option key={asText(r.id)} value={asText(r.id)}>{asText(r.name)}</option>)}
                      </select>
                      <input className="input" placeholder={form.name} value={editShippingRule.name} onChange={(e) => setEditShippingRule((v) => ({ ...v, name: e.target.value }))} />
                      <select className="select" value={editShippingRule.type} onChange={(e) => setEditShippingRule((v) => ({ ...v, type: e.target.value }))}>
                        <option value="flat">flat</option><option value="free">free</option><option value="threshold">threshold</option>
                      </select>
                      <input className="input" placeholder={form.amountMinor} value={editShippingRule.amountMinor} onChange={(e) => setEditShippingRule((v) => ({ ...v, amountMinor: e.target.value }))} />
                    </div>
                    <Button className="mt-2" variant="muted" onClick={() => void onUpdateShippingRule()}>{form.updateShipping}</Button>
                  </div>
                </div>
              </Card>
            </section>
          </>
        ) : null}

        {!loading && tab === "orders" ? (
          <>
            <OrdersTab
              orders={orders}
              asText={asText}
              money={money}
              openOrderEvents={openOrderEvents}
              labels={{
                ordersTable: form.ordersTable,
                noOrders: form.noOrders,
                ordersWillAppear: form.ordersWillAppear,
                order: form.order,
                status: form.status,
                total: form.total,
                action: form.action,
                viewEvents: form.viewEvents,
              }}
            />
            <Card>
              <h3 className="text-lg font-bold">{form.orderActions}</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <select className="select" value={orderAction.orderId} onChange={(e) => setOrderAction((v) => ({ ...v, orderId: e.target.value }))}>
                  <option value="">{form.selectOrder}</option>
                  {orders.map((o) => <option key={asText(o.id)} value={asText(o.id)}>{asText(o.order_number)}</option>)}
                </select>
                <select className="select" value={orderAction.status} onChange={(e) => setOrderAction((v) => ({ ...v, status: e.target.value }))}>
                  <option value="confirmed">confirmed</option><option value="processing">processing</option><option value="completed">completed</option><option value="cancelled">cancelled</option>
                </select>
                <select className="select" value={orderAction.paymentStatus} onChange={(e) => setOrderAction((v) => ({ ...v, paymentStatus: e.target.value }))}>
                  <option value="paid">paid</option><option value="unpaid">unpaid</option><option value="refunded">refunded</option>
                </select>
                <Button onClick={() => void onUpdateOrder()}>{form.updateStatus}</Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="muted" onClick={() => void onResendOrderEmail()}>{form.resendEmail}</Button>
                <Button variant="muted" onClick={() => void onSendConfirmationEmail()}>{form.sendConfirmation}</Button>
                <Button variant="muted" onClick={() => void onGetWhatsappPreview()}>{form.whatsappPreview}</Button>
              </div>
            </Card>
          </>
        ) : null}

        {!loading && tab === "customers" ? (
          <>
            <CustomersTab
              customers={customers}
              asText={asText}
              labels={{
                customers: form.customers,
                noCustomers: form.noCustomers,
                customersFromCheckout: form.customersFromCheckout,
              }}
            />
            <Card>
              <h3 className="text-lg font-bold">{form.customerAddresses}</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <select className="select" value={addressDraft.customerId} onChange={(e) => setAddressDraft((v) => ({ ...v, customerId: e.target.value }))}>
                  <option value="">{form.selectCustomer}</option>
                  {customers.map((c) => <option key={asText(c.id)} value={asText(c.id)}>{asText(c.full_name) || asText(c.email) || asText(c.phone)}</option>)}
                </select>
                <input className="input" placeholder={form.addressLine1} value={addressDraft.addressLine1} onChange={(e) => setAddressDraft((v) => ({ ...v, addressLine1: e.target.value }))} />
                <input className="input" placeholder={form.city} value={addressDraft.city} onChange={(e) => setAddressDraft((v) => ({ ...v, city: e.target.value }))} />
                <Button onClick={() => void onCreateAddress()}>{form.createAddress}</Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="muted" onClick={() => void onLoadAddresses(addressDraft.customerId)}>{form.loadAddresses}</Button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <select className="select" value={addressEdit.id} onChange={(e) => {
                  const found = customerAddresses.find((addr) => asText(addr.id) === e.target.value);
                  setAddressEdit({
                    id: e.target.value,
                    addressLine1: asText(found?.address_line1),
                    city: asText(found?.city),
                    countryCode: asText(found?.country_code) || "SA",
                  });
                }}>
                  <option value="">{form.selectAddressToEdit}</option>
                  {customerAddresses.map((addr) => (
                    <option key={asText(addr.id)} value={asText(addr.id)}>
                      {asText(addr.address_line1)} • {asText(addr.city)}
                    </option>
                  ))}
                </select>
                <input className="input" placeholder={form.addressLine1} value={addressEdit.addressLine1} onChange={(e) => setAddressEdit((v) => ({ ...v, addressLine1: e.target.value }))} />
                <input className="input" placeholder={form.city} value={addressEdit.city} onChange={(e) => setAddressEdit((v) => ({ ...v, city: e.target.value }))} />
                <Button variant="muted" onClick={() => void onUpdateAddress()}>{form.updateAddress}</Button>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {customerAddresses.map((addr) => (
                  <li key={asText(addr.id)} className="flex items-center justify-between rounded border border-[#d9ddcf] bg-white p-2">
                    <span>{asText(addr.address_line1)} • {asText(addr.city)} • {asText(addr.country_code)}</span>
                    <Button variant="danger" onClick={() => void onDeleteAddress(asText(addr.id))}>{form.delete}</Button>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        ) : null}

        {!loading && tab === "analytics" ? (
          <AnalyticsTab
            analyticsOverview={analyticsOverview}
            topProducts={topProducts}
            searchQueries={searchQueries}
            ordersTimeseries={ordersTimeseries}
            emailSummary={emailSummary}
            asText={asText}
            labels={{
              overview: form.overview,
              topProducts: form.topProducts,
              noTopProductsYet: form.noTopProductsYet,
              sold: form.sold,
              searchQueries: form.searchQueries,
              noSearchesYet: form.noSearchesYet,
              orders: form.orders,
              emailEvents: form.emailEvents,
              noOrders: form.noOrders,
              noEmailEvents: form.noEmailEvents,
            }}
          />
        ) : null}

        {!loading && tab === "integrations" ? (
          <IntegrationsTab
            webhooks={webhooks}
            asText={asText}
            webhookDraft={webhookDraft}
            setWebhookDraft={setWebhookDraft}
            webhookEdit={webhookEdit}
            setWebhookEdit={setWebhookEdit}
            onCreateWebhook={onCreateWebhook}
            onUpdateWebhook={onUpdateWebhook}
            onDeleteWebhook={onDeleteWebhook}
            onTestWebhook={onTestWebhook}
            labels={{
              createWebhook: form.createWebhook,
              editWebhook: form.editWebhook,
              selectWebhook: form.selectWebhook,
              webhookName: form.webhookName,
              webhookUrl: form.webhookUrl,
              webhookEvents: form.webhookEvents,
              create: form.create,
              update: form.update,
              webhooks: form.webhooks,
              noWebhooks: form.noWebhooks,
              createWebhookHelp: form.createWebhookHelp,
              test: form.test,
              delete: form.delete,
            }}
          />
        ) : null}

        {!loading && tab === "ops" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-bold">{form.sections}</h3>
              <div className="mt-3 space-y-2">
                <input className="input" placeholder={form.sectionTitle} value={newSection.title} onChange={(e) => setNewSection((v) => ({ ...v, title: e.target.value }))} />
                <input className="input" placeholder={form.subtitle} value={newSection.subtitle} onChange={(e) => setNewSection((v) => ({ ...v, subtitle: e.target.value }))} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <select className="select" value={newSection.pageKey} onChange={(e) => setNewSection((v) => ({ ...v, pageKey: e.target.value }))}><option value="home">home</option><option value="product">product</option><option value="checkout">checkout</option><option value="custom">custom</option></select>
                  <select className="select" value={newSection.sectionType} onChange={(e) => setNewSection((v) => ({ ...v, sectionType: e.target.value }))}><option value="hero">hero</option><option value="banner">banner</option><option value="featured_products">featured_products</option><option value="trending">trending</option><option value="custom_html">custom_html</option></select>
                  <input className="input" placeholder={form.position} value={newSection.position} onChange={(e) => setNewSection((v) => ({ ...v, position: e.target.value }))} />
                </div>
                <Button onClick={() => void onCreateSection()}>{form.createSection}</Button>
                <div className="rounded border border-[#d9ddcf] p-2">
                  <p className="mb-2 text-sm font-semibold">{form.editSection}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className="select" value={editSection.id} onChange={(e) => {
                      const found = sections.find((s) => asText(s.id) === e.target.value);
                      setEditSection({
                        id: e.target.value,
                        title: asText(found?.title),
                        subtitle: asText(found?.subtitle),
                        position: asText(found?.position || 0),
                      });
                    }}>
                      <option value="">{form.selectSection}</option>
                      {sections.map((s) => <option key={asText(s.id)} value={asText(s.id)}>{asText(s.title) || asText(s.id)}</option>)}
                    </select>
                    <input className="input" placeholder={form.sectionTitle} value={editSection.title} onChange={(e) => setEditSection((v) => ({ ...v, title: e.target.value }))} />
                    <input className="input" placeholder={form.subtitle} value={editSection.subtitle} onChange={(e) => setEditSection((v) => ({ ...v, subtitle: e.target.value }))} />
                    <input className="input" placeholder={form.position} value={editSection.position} onChange={(e) => setEditSection((v) => ({ ...v, position: e.target.value }))} />
                  </div>
                  <Button className="mt-2" variant="muted" onClick={() => void onUpdateSection()}>{form.updateSection}</Button>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {sections.map((s) => (
                  <li key={asText(s.id)} className="flex items-center justify-between rounded border border-[#d9ddcf] bg-white p-2">
                    <span>{asText(s.title)} • {asText(s.section_type)}</span>
                    <Button variant="danger" onClick={() => void onDeleteSection(asText(s.id))}>{form.delete}</Button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="text-lg font-bold">{form.themesSubscription}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {themes.map((t) => (
                  <li key={asText(t.id)} className="flex items-center justify-between rounded border border-[#d9ddcf] bg-white p-2">
                    <span>{asText(t.name)} {asText(t.is_active) === "true" ? `(${form.active})` : ""}</span>
                    <Button variant="muted" onClick={() => void onActivateTheme(asText(t.id))}>{form.activate}</Button>
                  </li>
                ))}
              </ul>

              <p className="soft mt-4 code">{JSON.stringify(subscription)}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => void onPatchSubscription()}>{form.setPlanPro}</Button>
                <Button variant="muted" onClick={() => void onMarkPaid()}>{form.markPaid}</Button>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="text-lg font-bold">{form.emailEvents}</h3>
              {emailEvents.length === 0 ? (
                <EmptyState title={form.noEmailEvents} description={form.emailEventsHelp} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead><tr className="border-b border-[#d9ddcf]"><th className="py-2">{form.to}</th><th className="py-2">{form.provider}</th><th className="py-2">{form.lifecycle}</th><th className="py-2">{form.status}</th></tr></thead>
                    <tbody>
                      {emailEvents.map((e) => (
                        <tr key={asText(e.id)} className="border-b border-[#eef1e6]"><td className="py-2">{asText(e.to_email)}</td><td className="py-2">{asText(e.provider)}</td><td className="py-2">{asText(e.lifecycle_status)}</td><td className="py-2">{asText(e.status)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </section>
        ) : null}
      </div>
    </main>
  );
}
