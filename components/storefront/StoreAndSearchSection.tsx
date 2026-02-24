import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  store: Record<string, unknown> | null;
  sections: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  labels: {
    store: string;
    unresolved: string;
    untitled: string;
    search: string;
    searchPlaceholder: string;
    allCategories: string;
    previewMode?: string;
    activeTheme?: string;
  };
  search: string;
  setSearch: (value: string) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  locale: "en" | "ar";
  setLocale: (value: "en" | "ar") => void;
  rtl: boolean;
  setRtl: (value: boolean) => void;
  preferredCurrency: string;
  setPreferredCurrency: (value: string) => void;
  directionLabel: string;
  currencyPlaceholder: string;
  searchProducts: () => Promise<void>;
  isPreview: boolean;
  themeName: string;
  themeVariant: "classic" | "minimal" | "luxe" | "desert";
};

export function StoreAndSearchSection({
  store,
  sections,
  categories,
  labels,
  search,
  setSearch,
  categoryId,
  setCategoryId,
  locale,
  setLocale,
  rtl,
  setRtl,
  preferredCurrency,
  setPreferredCurrency,
  directionLabel,
  currencyPlaceholder,
  searchProducts,
  isPreview,
  themeName,
  themeVariant,
}: Props) {
  const sectionGridClass =
    themeVariant === "minimal"
      ? "mt-3 space-y-2"
      : themeVariant === "luxe"
        ? "mt-3 grid gap-3 sm:grid-cols-1 xl:grid-cols-3"
        : "mt-3 grid gap-2 sm:grid-cols-2";

  const shellClass =
    themeVariant === "luxe"
      ? "rounded-xl border border-[#d8c27f] bg-[#fffaf0] p-4"
      : themeVariant === "desert"
        ? "rounded-xl border border-[#dfb9a8] bg-[#fff6f1] p-4"
        : "rounded-xl border border-[#d9ddcf] bg-white p-4";

  function sectionVisual(section: Record<string, unknown>) {
    const type = String(section.section_type || "");
    const config = (section.config_json as Record<string, unknown> | undefined) || {};
    const title = String(section.title || labels.untitled);
    const subtitle = String(section.subtitle || "");
    const imageUrl = String(config.image_url || "");
    const ctaLabel = String(config.cta_label || "");
    const ctaUrl = String(config.cta_url || "");

    if (type === "hero" || type === "banner") {
      const heroClass =
        themeVariant === "minimal"
          ? "rounded-xl border border-[#d9ddcf] bg-white p-4"
          : themeVariant === "luxe"
            ? "rounded-xl border border-[#dcc58d] bg-gradient-to-r from-[#fff8e6] to-[#fff0c9] p-4"
            : themeVariant === "desert"
              ? "rounded-xl border border-[#dfb9a8] bg-gradient-to-r from-[#ffe9df] to-[#fff4eb] p-4"
              : "rounded-xl border border-[#d9ddcf] bg-gradient-to-r from-[#e8f0ff] to-[#fff4dd] p-4";
      return (
        <div
          className={heroClass}
          style={imageUrl ? { backgroundImage: `linear-gradient(rgba(255,255,255,0.80), rgba(255,255,255,0.88)), url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          <p className="badge badge-info">{type}</p>
          <p className="mt-2 text-lg font-black">{title}</p>
          {subtitle ? <p className="soft mt-1 text-sm">{subtitle}</p> : null}
          {ctaLabel ? (
            <a href={ctaUrl || "#"} className="button button-primary mt-3 inline-flex">{ctaLabel}</a>
          ) : null}
        </div>
      );
    }

    if (type === "featured_products" || type === "trending") {
      const itemCount = Number(config.item_count || 0);
      return (
        <div className={shellClass}>
          <p className="badge badge-warn">{type}</p>
          <p className="mt-2 font-semibold">{title}</p>
          <p className="soft mt-1 text-sm">{subtitle || `${itemCount || 0} items configured`}</p>
        </div>
      );
    }

    return (
      <div className={shellClass}>
        <p className="badge badge-warn">{type || "section"}</p>
        <p className="mt-2 font-semibold">{title}</p>
        <p className="soft text-sm">{subtitle}</p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="text-xl font-bold">{labels.store}</h2>
        <p className="soft mt-1">{store ? `${String(store.name)} • ${String(store.default_currency)}` : labels.unresolved}</p>
        <p className="soft mt-1">{labels.activeTheme || "Active theme"}: {themeName}</p>
        {isPreview ? (
          <p className="badge badge-warn mt-2">{labels.previewMode || "Preview mode"}</p>
        ) : null}
        <div className={sectionGridClass}>
          {sections.map((s) => (
            <div key={String(s.id)}>
              {sectionVisual(s)}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">{labels.search}</h2>
        <div className="mt-3 space-y-2">
          <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={labels.searchPlaceholder} />
          <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{labels.allCategories}</option>
            {categories.map((category) => (
              <option key={String(category.id)} value={String(category.id)}>
                {String(category.name || category.slug || category.id)}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <select className="select" value={locale} onChange={(e) => setLocale(e.target.value as "en" | "ar")}>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            <select className="select" value={rtl ? "rtl" : "ltr"} onChange={(e) => setRtl(e.target.value === "rtl")}>
              <option value="ltr">LTR</option>
              <option value="rtl">{directionLabel} RTL</option>
            </select>
            <input className="input" value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value.toUpperCase())} placeholder={currencyPlaceholder} />
          </div>
          <Button onClick={() => void searchProducts()}>{labels.search}</Button>
        </div>
      </Card>
    </section>
  );
}
