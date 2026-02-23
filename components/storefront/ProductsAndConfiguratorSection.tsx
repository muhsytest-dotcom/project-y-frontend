import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_amount_minor: number;
  currency_code: string;
};

type Props = {
  products: Product[];
  labels: {
    products: string;
    noProductsTitle: string;
    noProductsDesc: string;
    customize: string;
    configurator: string;
    noProductSelected: string;
    addToCart: string;
  };
  selectedProduct: Record<string, unknown> | null;
  selectedOptionValueIds: string[];
  setSelectedOptionValueIds: (value: string[]) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  loadProduct: (slug: string) => Promise<void>;
  addToCart: () => Promise<void>;
  amount: (minor: number | undefined, currencyCode: string | undefined) => string;
};

export function ProductsAndConfiguratorSection({
  products,
  labels,
  selectedProduct,
  selectedOptionValueIds,
  setSelectedOptionValueIds,
  quantity,
  setQuantity,
  loadProduct,
  addToCart,
  amount,
}: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="text-xl font-bold">{labels.products}</h2>
        {products.length === 0 ? (
          <div className="mt-3">
            <EmptyState title={labels.noProductsTitle} description={labels.noProductsDesc} />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#d9ddcf] bg-white p-4">
                <p className="font-semibold">{p.name}</p>
                <p className="soft text-sm">{p.description || p.slug}</p>
                <p className="mt-1 font-bold">{amount(p.price_amount_minor, p.currency_code)}</p>
                <Button variant="muted" className="mt-3" onClick={() => void loadProduct(p.slug)}>{labels.customize}</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold">{labels.configurator}</h2>
        {!selectedProduct ? (
          <div className="mt-3">
            <EmptyState title={labels.noProductSelected} />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="font-semibold">{String(selectedProduct.name)}</p>
            <p className="font-bold">{amount(Number(selectedProduct.price_amount_minor || 0), String(selectedProduct.currency_code || ""))}</p>
            {((selectedProduct.options as Array<Record<string, unknown>> | undefined) || []).map((opt) => (
              <div key={String(opt.id)} className="rounded-xl border border-[#d9ddcf] p-3">
                <p className="font-semibold">{String(opt.name)}</p>
                <div className="mt-2 space-y-1">
                  {((opt.values as Array<Record<string, unknown>> | undefined) || []).map((value) => {
                    const id = String(value.id);
                    return (
                      <label key={id} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedOptionValueIds.includes(id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOptionValueIds([...selectedOptionValueIds, id]);
                            } else {
                              setSelectedOptionValueIds(selectedOptionValueIds.filter((v) => v !== id));
                            }
                          }}
                        />
                        {String(value.label)}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))} />
            <Button onClick={() => void addToCart()}>{labels.addToCart}</Button>
          </div>
        )}
      </Card>
    </section>
  );
}
