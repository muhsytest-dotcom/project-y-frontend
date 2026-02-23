import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  orders: Array<Record<string, unknown>>;
  asText: (value: unknown) => string;
  money: (minor: unknown, code: unknown) => string;
  openOrderEvents: (orderId: string, orderNumber: string) => Promise<void>;
  labels: {
    ordersTable: string;
    noOrders: string;
    ordersWillAppear: string;
    order: string;
    status: string;
    total: string;
    action: string;
    viewEvents: string;
  };
};

export function OrdersTab({ orders, asText, money, openOrderEvents, labels }: Props) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{labels.ordersTable}</h3>
      {orders.length === 0 ? (
        <EmptyState title={labels.noOrders} description={labels.ordersWillAppear} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#d9ddcf]">
                <th className="py-2">{labels.order}</th>
                <th className="py-2">{labels.status}</th>
                <th className="py-2">{labels.total}</th>
                <th className="py-2">{labels.action}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={asText(o.id)} className="border-b border-[#eef1e6]">
                  <td className="py-2 font-semibold">{asText(o.order_number)}</td>
                  <td className="py-2">{asText(o.status)}</td>
                  <td className="py-2">{money(o.total_amount_minor, o.currency_code)}</td>
                  <td className="py-2">
                    <Button variant="muted" onClick={() => void openOrderEvents(asText(o.id), asText(o.order_number))}>{labels.viewEvents}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
