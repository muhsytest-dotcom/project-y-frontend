import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type ProductDraft = { name: string; slug: string; priceMinor: string; currency: string };
type CategoryDraft = { name: string; slug: string };

type Props = {
  products: Array<Record<string, unknown>>;
  newProduct: ProductDraft;
  setNewProduct: (next: ProductDraft) => void;
  onCreateProduct: () => Promise<void>;
  newCategory: CategoryDraft;
  setNewCategory: (next: CategoryDraft) => void;
  onCreateCategory: () => Promise<void>;
  money: (minor: unknown, code: unknown) => string;
  asText: (value: unknown) => string;
  labels: {
    createProduct: string;
    createCategory: string;
    name: string;
    slug: string;
    priceMinor: string;
    currency: string;
    create: string;
    productTable: string;
    noProductsYet: string;
    createFirstProduct: string;
    status: string;
    price: string;
  };
};

export function CatalogTab({
  products,
  newProduct,
  setNewProduct,
  onCreateProduct,
  newCategory,
  setNewCategory,
  onCreateCategory,
  money,
  asText,
  labels,
}: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="text-lg font-bold">{labels.createProduct}</h3>
        <div className="mt-3 space-y-2">
          <input className="input" placeholder={labels.name} value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
          <input className="input" placeholder={labels.slug} value={newProduct.slug} onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder={labels.priceMinor} value={newProduct.priceMinor} onChange={(e) => setNewProduct({ ...newProduct, priceMinor: e.target.value })} />
            <input className="input" placeholder={labels.currency} value={newProduct.currency} onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })} />
          </div>
          <Button onClick={() => void onCreateProduct()}>{labels.createProduct}</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold">{labels.createCategory}</h3>
        <div className="mt-3 space-y-2">
          <input className="input" placeholder={labels.name} value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
          <input className="input" placeholder={labels.slug} value={newCategory.slug} onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })} />
          <Button onClick={() => void onCreateCategory()}>{labels.createCategory}</Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-bold">{labels.productTable}</h3>
        {products.length === 0 ? (
          <EmptyState title={labels.noProductsYet} description={labels.createFirstProduct} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9ddcf]">
                  <th className="py-2">{labels.name}</th>
                  <th className="py-2">{labels.status}</th>
                  <th className="py-2">{labels.price}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={asText(p.id)} className="border-b border-[#eef1e6]">
                    <td className="py-2 font-semibold">{asText(p.name)}</td>
                    <td className="py-2">{asText(p.status)}</td>
                    <td className="py-2">{money(p.base_price_amount_minor, p.currency_code)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
