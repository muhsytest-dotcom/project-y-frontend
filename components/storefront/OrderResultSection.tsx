import { Card } from "@/components/ui/Card";

type Props = {
  orderResult: Record<string, unknown>;
  labels: {
    orderCreated: string;
    total: string;
    openConfirmation: string;
    continueWhatsApp: string;
  };
  amount: (minor: number | undefined, currencyCode: string | undefined) => string;
};

export function OrderResultSection({ orderResult, labels, amount }: Props) {
  return (
    <Card>
      <h2 className="text-xl font-bold">{labels.orderCreated}</h2>
      <p className="mt-2 font-semibold">{String(orderResult.order_number || "")}</p>
      <p className="soft">{labels.total}: {amount(Number(orderResult.total_amount_minor || 0), String(orderResult.currency_code || ""))}</p>
      {orderResult.confirmation_token ? (
        <a className="button button-muted mt-3 inline-flex" href={`/storefront/confirmation/${encodeURIComponent(String(orderResult.confirmation_token))}`}>
          {labels.openConfirmation}
        </a>
      ) : null}
      {orderResult.whatsapp_url ? (
        <a className="button button-primary mt-3 inline-flex" href={String(orderResult.whatsapp_url)} target="_blank" rel="noreferrer">
          {labels.continueWhatsApp}
        </a>
      ) : null}
    </Card>
  );
}
