import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  customers: Array<Record<string, unknown>>;
  asText: (value: unknown) => string;
  labels: {
    customers: string;
    noCustomers: string;
    customersFromCheckout: string;
  };
};

export function CustomersTab({ customers, asText, labels }: Props) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{labels.customers}</h3>
      {customers.length === 0 ? (
        <EmptyState title={labels.noCustomers} description={labels.customersFromCheckout} />
      ) : (
        <ul className="space-y-2 text-sm">
          {customers.map((c) => (
            <li key={asText(c.id)} className="rounded-xl border border-[#d9ddcf] bg-white p-3">
              <p className="font-semibold">{asText(c.full_name) || asText(c.email) || asText(c.phone)}</p>
              <p className="soft">{asText(c.email)} {asText(c.phone)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
