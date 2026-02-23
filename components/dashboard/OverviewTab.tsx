import { Card } from "@/components/ui/Card";

type Props = {
  storeName: string;
  productsCount: number;
  ordersCount: number;
  customersCount: number;
  labels: {
    store: string;
    products: string;
    orders: string;
    customers: string;
  };
};

export function OverviewTab({ storeName, productsCount, ordersCount, customersCount, labels }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card><p className="soft text-sm">{labels.store}</p><p className="mt-1 text-2xl font-black">{storeName || "-"}</p></Card>
      <Card><p className="soft text-sm">{labels.products}</p><p className="mt-1 text-2xl font-black">{productsCount}</p></Card>
      <Card><p className="soft text-sm">{labels.orders}</p><p className="mt-1 text-2xl font-black">{ordersCount}</p></Card>
      <Card><p className="soft text-sm">{labels.customers}</p><p className="mt-1 text-2xl font-black">{customersCount}</p></Card>
    </section>
  );
}
