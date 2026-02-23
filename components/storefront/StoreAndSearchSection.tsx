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
  searchProducts: () => Promise<void>;
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
  searchProducts,
}: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="text-xl font-bold">{labels.store}</h2>
        <p className="soft mt-1">{store ? `${String(store.name)} • ${String(store.default_currency)}` : labels.unresolved}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {sections.map((s) => (
            <div key={String(s.id)} className="rounded-xl border border-[#d9ddcf] bg-white p-3">
              <p className="badge badge-warn">{String(s.section_type)}</p>
              <p className="mt-2 font-semibold">{String(s.title || labels.untitled)}</p>
              <p className="soft text-sm">{String(s.subtitle || "")}</p>
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
              <option value="rtl">RTL</option>
            </select>
            <input className="input" value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value.toUpperCase())} placeholder="SAR" />
          </div>
          <Button onClick={() => void searchProducts()}>{labels.search}</Button>
        </div>
      </Card>
    </section>
  );
}
