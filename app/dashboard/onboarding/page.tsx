"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, billingApi, catalogApi, contentApi, storesApi } from "@/lib/api";
import { clearStoredSession, getStoredSession, SessionState, setStoredSession, withAutoRefresh } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toast, ToastStack } from "@/components/ui/ToastStack";
import { Locale, t } from "@/lib/i18n";
import { getPreferredLocale, setPreferredLocale } from "@/lib/locale";

const steps = ["brand", "seo", "first_product", "options", "sections", "preview", "payment", "domain"] as const;
type Step = (typeof steps)[number];

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale("en"));
  const [session, setSession] = useState<SessionState>({ access: "", refresh: "" });
  const [storeId, setStoreId] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>("brand");
  const [loading, setLoading] = useState(false);

  const [brandDraft, setBrandDraft] = useState({
    name: "",
    whatsapp_number: "",
    support_email: "",
    city: "",
    logo_url: "",
    favicon_url: "",
  });
  const [seoDraft, setSeoDraft] = useState({ seo_title: "", seo_description: "" });
  const [productDraft, setProductDraft] = useState({ name: "", slug: "", base_price_amount_minor: "1000", currency_code: "SAR" });
  const [optionDraft, setOptionDraft] = useState({ product_id: "", name: "Size", option_kind: "variant", selection_type: "single" });
  const [sectionDraft, setSectionDraft] = useState({ page_key: "home", section_type: "hero", title: "", subtitle: "", position: "0" });
  const [paymentDraft, setPaymentDraft] = useState({ plan_code: "pro", amount_minor: "2000", external_ref: "" });
  const [domainDraft, setDomainDraft] = useState({ host: "", type: "custom" as "subdomain" | "custom", selectedDomainId: "" });
  const [domains, setDomains] = useState<Array<Record<string, unknown>>>([]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const words = t(locale).dashboard.wizard;
  const toast = words.toast;

  /* eslint-disable react-hooks/exhaustive-deps */
  // Bootstrap should run once on mount; locale text changes should not re-trigger API bootstrap.
  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);
    void (async () => {
      setLoading(true);
      try {
        const storesRes = await withAutoRefresh(stored, setSession, (token) => authApi.meStores(token || undefined));
        if (!storesRes.stores.length) {
          pushToast("error", toast.noStores);
          return;
        }
        const firstStoreId = storesRes.stores[0].store_id;
        setStoreId(firstStoreId);

        const [store, settings, onboarding, products, domainsRes] = await Promise.all([
          withAutoRefresh(stored, setSession, (token) => storesApi.getStore(token, firstStoreId)),
          withAutoRefresh(stored, setSession, (token) => storesApi.getSettings(token, firstStoreId)),
          withAutoRefresh(stored, setSession, (token) => storesApi.getOnboarding(token, firstStoreId)),
          withAutoRefresh(stored, setSession, (token) => catalogApi.listProducts(token, firstStoreId)),
          withAutoRefresh(stored, setSession, (token) => storesApi.listDomains(token, firstStoreId)),
        ]);

        setBrandDraft({
          name: String(store.name || ""),
          whatsapp_number: String(store.whatsapp_number || ""),
          support_email: String(store.support_email || ""),
          city: String(store.city || ""),
          logo_url: String(store.logo_url || ""),
          favicon_url: String(store.favicon_url || ""),
        });
        setSeoDraft({
          seo_title: String(settings.seo_title || ""),
          seo_description: String(settings.seo_description || ""),
        });
        const firstProductId = String(products.items?.[0]?.id || "");
        setOptionDraft((prev) => ({ ...prev, product_id: firstProductId }));
        setDomains(domainsRes.items || []);

        const completedSteps = (onboarding.steps as Record<string, { completed?: boolean }> | undefined) || {};
        const nextStep = steps.find((s) => !completedSteps[s]?.completed) || "preview";
        setCurrentStep(nextStep);
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : toast.failedLoadWizard);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);
  /* eslint-enable react-hooks/exhaustive-deps */

  function pushToast(tone: Toast["tone"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 2500);
  }

  async function runWithSession<T>(fn: (token: string) => Promise<T>): Promise<T> {
    try {
      return await withAutoRefresh(session, (next) => {
        setSession(next);
        setStoredSession(next);
      }, fn);
    } catch (err) {
      clearStoredSession();
      router.replace("/auth");
      throw err;
    }
  }

  async function markStepCompleted(step: Step) {
    if (!storeId) return;
    await runWithSession((token) => storesApi.patchOnboarding(token, storeId, step, true));
  }

  async function saveBrand() {
    if (!storeId) return;
    setLoading(true);
    try {
      await runWithSession((token) =>
        storesApi.patchStore(token, storeId, {
          name: brandDraft.name,
          whatsapp_number: brandDraft.whatsapp_number,
          support_email: brandDraft.support_email,
          city: brandDraft.city,
          logo_url: brandDraft.logo_url,
          favicon_url: brandDraft.favicon_url,
        }),
      );
      await markStepCompleted("brand");
      setCurrentStep("seo");
      pushToast("success", toast.brandSaved);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedSaveBrand);
    } finally {
      setLoading(false);
    }
  }

  async function saveSeo() {
    if (!storeId) return;
    setLoading(true);
    try {
      await runWithSession((token) =>
        storesApi.patchSettings(token, storeId, {
          seo_title: seoDraft.seo_title,
          seo_description: seoDraft.seo_description,
        }),
      );
      await markStepCompleted("seo");
      setCurrentStep("first_product");
      pushToast("success", toast.seoSaved);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedSaveSeo);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    if (!storeId || !productDraft.name.trim() || !productDraft.slug.trim()) return;
    setLoading(true);
    try {
      const created = await runWithSession((token) =>
        catalogApi.createProduct(token, storeId, {
          name: productDraft.name.trim(),
          slug: productDraft.slug.trim(),
          product_type: "physical",
          status: "active",
          inventory_mode: "product",
          base_price_amount_minor: Number(productDraft.base_price_amount_minor),
          currency_code: productDraft.currency_code,
          track_inventory: false,
          stock_qty: null,
          allow_backorder: false,
          requires_shipping: true,
        }),
      );
      setOptionDraft((prev) => ({ ...prev, product_id: String(created.id || "") }));
      await markStepCompleted("first_product");
      setCurrentStep("options");
      pushToast("success", toast.firstProductCreated);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedCreateProduct);
    } finally {
      setLoading(false);
    }
  }

  async function createOption() {
    if (!storeId || !optionDraft.product_id || !optionDraft.name.trim()) return;
    setLoading(true);
    try {
      await runWithSession((token) =>
        catalogApi.createOption(token, storeId, optionDraft.product_id, {
          name: optionDraft.name.trim(),
          option_kind: optionDraft.option_kind,
          selection_type: optionDraft.selection_type,
        }),
      );
      await markStepCompleted("options");
      setCurrentStep("sections");
      pushToast("success", toast.optionsCompleted);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedCreateOption);
    } finally {
      setLoading(false);
    }
  }

  async function createSection() {
    if (!storeId || !sectionDraft.title.trim()) return;
    setLoading(true);
    try {
      await runWithSession((token) =>
        contentApi.createSection(token, storeId, {
          page_key: sectionDraft.page_key,
          section_type: sectionDraft.section_type,
          title: sectionDraft.title,
          subtitle: sectionDraft.subtitle,
          position: Number(sectionDraft.position),
        }),
      );
      await markStepCompleted("sections");
      setCurrentStep("preview");
      pushToast("success", toast.sectionsCompleted);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedCreateSection);
    } finally {
      setLoading(false);
    }
  }

  async function completePreview() {
    if (!storeId) return;
    setLoading(true);
    try {
      await markStepCompleted("preview");
      setCurrentStep("payment");
      pushToast("success", toast.previewCompleted);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedCompletePreview);
    } finally {
      setLoading(false);
    }
  }

  async function completePayment() {
    if (!storeId) return;
    setLoading(true);
    try {
      await runWithSession((token) =>
        billingApi.patchSubscription(token, storeId, {
          plan_code: paymentDraft.plan_code,
        }),
      );
      await runWithSession((token) =>
        billingApi.markPaid(token, storeId, {
          amount_minor: Number(paymentDraft.amount_minor || 0),
          external_ref: paymentDraft.external_ref || `manual-${Date.now()}`,
        }),
      );
      await runWithSession((token) => storesApi.publish(token, storeId));
      await markStepCompleted("payment");
      setCurrentStep("domain");
      pushToast("success", toast.paymentCompleted);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedCompletePayment);
    } finally {
      setLoading(false);
    }
  }

  async function createDomain() {
    if (!storeId || !domainDraft.host.trim()) return;
    setLoading(true);
    try {
      await runWithSession((token) =>
        storesApi.createDomain(token, storeId, {
          host: domainDraft.host.trim(),
          type: domainDraft.type,
        }),
      );
      await refreshDomains();
      setDomainDraft((prev) => ({ ...prev, host: "" }));
      pushToast("success", toast.domainAdded);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedCreateDomain);
    } finally {
      setLoading(false);
    }
  }

  async function verifyDomain() {
    if (!storeId || !domainDraft.selectedDomainId) return;
    setLoading(true);
    try {
      await runWithSession((token) => storesApi.verifyDomain(token, storeId, domainDraft.selectedDomainId));
      await refreshDomains();
      pushToast("success", toast.domainVerifyTriggered);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedVerifyDomain);
    } finally {
      setLoading(false);
    }
  }

  async function makePrimaryDomain() {
    if (!storeId || !domainDraft.selectedDomainId) return;
    setLoading(true);
    try {
      await runWithSession((token) => storesApi.makePrimaryDomain(token, storeId, domainDraft.selectedDomainId));
      await refreshDomains();
      pushToast("success", toast.primaryDomainUpdated);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.failedSetPrimaryDomain);
    } finally {
      setLoading(false);
    }
  }

  async function refreshDomains() {
    if (!storeId) return;
    const updated = await runWithSession((token) => storesApi.listDomains(token, storeId));
    setDomains(updated.items || []);
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
      pushToast("error", err instanceof Error ? err.message : toast.failedLoadWizard);
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (currentStep !== "domain" || !storeId) return;
    const hasPending = domains.some((d) => String(d.verification_status || "") === "pending");
    if (!hasPending) return;
    const interval = setInterval(() => {
      void refreshDomains();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentStep, storeId, domains]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <main className="px-4 py-8 sm:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ToastStack toasts={toasts} />
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="badge badge-info">{words.badge}</p>
              <h1 className="mt-3 text-2xl font-black sm:text-4xl">{words.title}</h1>
              <p className="soft mt-2">{words.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard" className="button button-muted">{words.backToDashboard}</Link>
              <Button variant="muted" onClick={() => void openPreviewStorefront()}>{words.openStorefront}</Button>
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
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {steps.map((step) => (
              <Button key={step} variant={currentStep === step ? "primary" : "muted"} onClick={() => setCurrentStep(step)}>
                {words.steps[step]}
              </Button>
            ))}
          </div>
        </Card>

        {currentStep === "brand" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.brand}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder={words.storeName} value={brandDraft.name} onChange={(e) => setBrandDraft((v) => ({ ...v, name: e.target.value }))} />
              <input className="input" placeholder={words.whatsappNumber} value={brandDraft.whatsapp_number} onChange={(e) => setBrandDraft((v) => ({ ...v, whatsapp_number: e.target.value }))} />
              <input className="input" placeholder={words.supportEmail} value={brandDraft.support_email} onChange={(e) => setBrandDraft((v) => ({ ...v, support_email: e.target.value }))} />
              <input className="input" placeholder={words.city} value={brandDraft.city} onChange={(e) => setBrandDraft((v) => ({ ...v, city: e.target.value }))} />
              <input className="input" placeholder={words.logoUrl} value={brandDraft.logo_url} onChange={(e) => setBrandDraft((v) => ({ ...v, logo_url: e.target.value }))} />
              <input className="input" placeholder={words.faviconUrl} value={brandDraft.favicon_url} onChange={(e) => setBrandDraft((v) => ({ ...v, favicon_url: e.target.value }))} />
            </div>
            <Button className="mt-3" onClick={() => void saveBrand()} disabled={loading}>{words.saveNext}</Button>
          </Card>
        ) : null}

        {currentStep === "seo" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.seo}</h2>
            <div className="mt-3 space-y-2">
              <input className="input" placeholder={words.seoTitle} value={seoDraft.seo_title} onChange={(e) => setSeoDraft((v) => ({ ...v, seo_title: e.target.value }))} />
              <textarea className="textarea" placeholder={words.seoDescription} value={seoDraft.seo_description} onChange={(e) => setSeoDraft((v) => ({ ...v, seo_description: e.target.value }))} />
            </div>
            <Button className="mt-3" onClick={() => void saveSeo()} disabled={loading}>{words.saveNext}</Button>
          </Card>
        ) : null}

        {currentStep === "first_product" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.firstProduct}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder={words.name} value={productDraft.name} onChange={(e) => setProductDraft((v) => ({ ...v, name: e.target.value }))} />
              <input className="input" placeholder={words.slug} value={productDraft.slug} onChange={(e) => setProductDraft((v) => ({ ...v, slug: e.target.value }))} />
              <input className="input" placeholder={words.priceMinor} value={productDraft.base_price_amount_minor} onChange={(e) => setProductDraft((v) => ({ ...v, base_price_amount_minor: e.target.value }))} />
              <input className="input" placeholder={words.currency} value={productDraft.currency_code} onChange={(e) => setProductDraft((v) => ({ ...v, currency_code: e.target.value.toUpperCase() }))} />
            </div>
            <Button className="mt-3" onClick={() => void createProduct()} disabled={loading}>{words.createNext}</Button>
          </Card>
        ) : null}

        {currentStep === "options" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.options}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder={words.productId} value={optionDraft.product_id} onChange={(e) => setOptionDraft((v) => ({ ...v, product_id: e.target.value }))} />
              <input className="input" placeholder={words.optionName} value={optionDraft.name} onChange={(e) => setOptionDraft((v) => ({ ...v, name: e.target.value }))} />
              <select className="select" value={optionDraft.option_kind} onChange={(e) => setOptionDraft((v) => ({ ...v, option_kind: e.target.value }))}>
                <option value="variant">variant</option>
                <option value="addon">addon</option>
                <option value="input">input</option>
              </select>
              <select className="select" value={optionDraft.selection_type} onChange={(e) => setOptionDraft((v) => ({ ...v, selection_type: e.target.value }))}>
                <option value="single">single</option>
                <option value="multiple">multiple</option>
              </select>
            </div>
            <Button className="mt-3" onClick={() => void createOption()} disabled={loading}>{words.createNext}</Button>
          </Card>
        ) : null}

        {currentStep === "sections" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.sections}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder={words.titleLabel} value={sectionDraft.title} onChange={(e) => setSectionDraft((v) => ({ ...v, title: e.target.value }))} />
              <input className="input" placeholder={words.subtitleLabel} value={sectionDraft.subtitle} onChange={(e) => setSectionDraft((v) => ({ ...v, subtitle: e.target.value }))} />
              <select className="select" value={sectionDraft.page_key} onChange={(e) => setSectionDraft((v) => ({ ...v, page_key: e.target.value }))}>
                <option value="home">home</option>
                <option value="product">product</option>
                <option value="checkout">checkout</option>
                <option value="custom">custom</option>
              </select>
              <select className="select" value={sectionDraft.section_type} onChange={(e) => setSectionDraft((v) => ({ ...v, section_type: e.target.value }))}>
                <option value="hero">hero</option>
                <option value="banner">banner</option>
                <option value="featured_products">featured_products</option>
                <option value="trending">trending</option>
                <option value="custom_html">custom_html</option>
              </select>
            </div>
            <Button className="mt-3" onClick={() => void createSection()} disabled={loading}>{words.createNext}</Button>
          </Card>
        ) : null}

        {currentStep === "preview" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.previewPublish}</h2>
            <p className="soft mt-2">{words.previewHelp}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="muted" onClick={() => void openPreviewStorefront()}>{words.previewStorefront}</Button>
              <Button onClick={() => void completePreview()} disabled={loading}>{words.continueToPayment}</Button>
            </div>
          </Card>
        ) : null}

        {currentStep === "payment" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.payment}</h2>
            <p className="soft mt-2">{words.paymentHelp}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <select className="select" value={paymentDraft.plan_code} onChange={(e) => setPaymentDraft((v) => ({ ...v, plan_code: e.target.value }))}>
                <option value="basic">basic</option>
                <option value="pro">pro</option>
                <option value="premium">premium</option>
              </select>
              <input className="input" placeholder={words.amountMinor} value={paymentDraft.amount_minor} onChange={(e) => setPaymentDraft((v) => ({ ...v, amount_minor: e.target.value }))} />
              <input className="input" placeholder={words.externalRef} value={paymentDraft.external_ref} onChange={(e) => setPaymentDraft((v) => ({ ...v, external_ref: e.target.value }))} />
            </div>
            <Button className="mt-3" onClick={() => void completePayment()} disabled={loading}>{words.markPaidPublish}</Button>
          </Card>
        ) : null}

        {currentStep === "domain" ? (
          <Card>
            <h2 className="text-xl font-bold">{words.domainConnect}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input className="input" placeholder={words.domainPlaceholder} value={domainDraft.host} onChange={(e) => setDomainDraft((v) => ({ ...v, host: e.target.value }))} />
              <select className="select" value={domainDraft.type} onChange={(e) => setDomainDraft((v) => ({ ...v, type: e.target.value as "subdomain" | "custom" }))}>
                <option value="custom">custom</option>
                <option value="subdomain">subdomain</option>
              </select>
              <Button onClick={() => void createDomain()} disabled={loading}>{words.addDomain}</Button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <select className="select" value={domainDraft.selectedDomainId} onChange={(e) => setDomainDraft((v) => ({ ...v, selectedDomainId: e.target.value }))}>
                <option value="">{words.selectDomain}</option>
                {domains.map((domain) => (
                  <option key={String(domain.id)} value={String(domain.id)}>
                    {String(domain.host)} ({String(domain.verification_status || "pending")})
                  </option>
                ))}
              </select>
              <Button variant="muted" onClick={() => void verifyDomain()} disabled={loading}>{words.verify}</Button>
              <Button variant="muted" onClick={() => void makePrimaryDomain()} disabled={loading}>{words.makePrimary}</Button>
            </div>

            <div className="mt-3">
              <Button variant="muted" onClick={() => void refreshDomains()} disabled={loading}>{words.refreshDomains}</Button>
            </div>

            {domainDraft.selectedDomainId ? (
              <div className="mt-3 rounded-xl border border-[#d9ddcf] bg-white p-3 text-sm">
                {(() => {
                  const selected = domains.find((d) => String(d.id) === domainDraft.selectedDomainId);
                  if (!selected) return null;
                  const dnsTarget = String(selected.dns_target || "cname.yourapp.com");
                  const status = String(selected.verification_status || "pending");
                  return (
                    <div className="space-y-2">
                      <p><span className="font-semibold">{words.dnsTarget}:</span> <span className="code">{dnsTarget}</span></p>
                      <p><span className="font-semibold">{words.verificationStatus}:</span> {status}</p>
                      <div>
                        <p className="font-semibold">{words.dnsInstructions}</p>
                        <ol className="mt-1 list-decimal space-y-1 pl-5">
                          <li>{words.dnsStep1}</li>
                          <li>{words.dnsStep2}</li>
                          <li>{words.dnsStep3}</li>
                        </ol>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
    </main>
  );
}
