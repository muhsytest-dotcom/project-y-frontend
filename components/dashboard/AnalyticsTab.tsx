import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  analyticsOverview: Record<string, unknown> | null;
  topProducts: Array<Record<string, unknown>>;
  searchQueries: Array<Record<string, unknown>>;
  asText: (value: unknown) => string;
  labels: {
    overview: string;
    topProducts: string;
    noTopProductsYet: string;
    sold: string;
    searchQueries: string;
    noSearchesYet: string;
  };
};

export function AnalyticsTab({ analyticsOverview, topProducts, searchQueries, asText, labels }: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="text-lg font-bold">{labels.overview}</h3>
        <p className="soft mt-2 code">{JSON.stringify(analyticsOverview)}</p>
      </Card>
      <Card>
        <h3 className="text-lg font-bold">{labels.topProducts}</h3>
        {topProducts.length === 0 ? (
          <EmptyState title={labels.noTopProductsYet} />
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {topProducts.map((p, idx) => (
              <li key={idx} className="rounded-xl border border-[#d9ddcf] bg-white p-3">
                {asText(p.product_name)} • {asText(p.quantity)} {labels.sold}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="lg:col-span-2">
        <h3 className="text-lg font-bold">{labels.searchQueries}</h3>
        {searchQueries.length === 0 ? (
          <EmptyState title={labels.noSearchesYet} />
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {searchQueries.map((q, idx) => (
              <span key={idx} className="badge badge-warn">
                {asText(q.search_query)} ({asText(q.count)})
              </span>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
