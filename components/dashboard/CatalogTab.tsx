import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type ProductDraft = { name: string; slug: string; priceMinor: string; currency: string };
type CategoryDraft = { name: string; slug: string };

type Props = {
  products: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  newProduct: ProductDraft;
  setNewProduct: (next: ProductDraft) => void;
  onCreateProduct: () => Promise<void>;
  editProduct: { id: string; name: string; slug: string; priceMinor: string; currency: string; status: string };
  setEditProduct: (next: { id: string; name: string; slug: string; priceMinor: string; currency: string; status: string }) => void;
  onUpdateProduct: () => Promise<void>;
  newCategory: CategoryDraft;
  setNewCategory: (next: CategoryDraft) => void;
  onCreateCategory: () => Promise<void>;
  editCategory: { id: string; name: string; slug: string };
  setEditCategory: (next: { id: string; name: string; slug: string }) => void;
  onUpdateCategory: () => Promise<void>;
  categoryLink: { productId: string; categoryId: string };
  setCategoryLink: (next: { productId: string; categoryId: string }) => void;
  onLinkProductCategory: () => Promise<void>;
  onUnlinkProductCategory: () => Promise<void>;
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
    update: string;
    add: string;
    delete: string;
    action: string;
    productTable: string;
    noProductsYet: string;
    createFirstProduct: string;
    status: string;
    price: string;
    selectProduct: string;
    updateDiscount: string;
    updateShipping: string;
  };
};

export function CatalogTab({
  products,
  categories,
  newProduct,
  setNewProduct,
  onCreateProduct,
  editProduct,
  setEditProduct,
  onUpdateProduct,
  newCategory,
  setNewCategory,
  onCreateCategory,
  editCategory,
  setEditCategory,
  onUpdateCategory,
  categoryLink,
  setCategoryLink,
  onLinkProductCategory,
  onUnlinkProductCategory,
  money,
  asText,
  labels,
}: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="text-lg font-bold">{labels.createProduct}</h3>
        <div className="mt-3 space-y-2" data-testid="catalog-create-product-form">
          <input
            className="input"
            data-testid="catalog-create-product-name"
            placeholder={labels.name}
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <input
            className="input"
            data-testid="catalog-create-product-slug"
            placeholder={labels.slug}
            value={newProduct.slug}
            onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="input"
              data-testid="catalog-create-product-price"
              placeholder={labels.priceMinor}
              value={newProduct.priceMinor}
              onChange={(e) => setNewProduct({ ...newProduct, priceMinor: e.target.value })}
            />
            <input
              className="input"
              data-testid="catalog-create-product-currency"
              placeholder={labels.currency}
              value={newProduct.currency}
              onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
            />
          </div>
          <Button data-testid="catalog-create-product-submit" onClick={() => void onCreateProduct()}>
            {labels.createProduct}
          </Button>
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

      <Card>
        <h3 className="text-lg font-bold">{labels.create}</h3>
        <div className="mt-3 space-y-2">
          <select
            className="select"
            value={editProduct.id}
            onChange={(e) => {
              const found = products.find((product) => asText(product.id) === e.target.value);
              setEditProduct({
                id: e.target.value,
                name: asText(found?.name),
                slug: asText(found?.slug),
                priceMinor: asText(found?.base_price_amount_minor || 0),
                currency: asText(found?.currency_code) || "SAR",
                status: asText(found?.status) || "active",
              });
            }}
          >
            <option value="">{labels.productTable}</option>
            {products.map((product) => (
              <option key={asText(product.id)} value={asText(product.id)}>
                {asText(product.name)}
              </option>
            ))}
          </select>
          <input className="input" placeholder={labels.name} value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
          <input className="input" placeholder={labels.slug} value={editProduct.slug} onChange={(e) => setEditProduct({ ...editProduct, slug: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="input" placeholder={labels.priceMinor} value={editProduct.priceMinor} onChange={(e) => setEditProduct({ ...editProduct, priceMinor: e.target.value })} />
            <input className="input" placeholder={labels.currency} value={editProduct.currency} onChange={(e) => setEditProduct({ ...editProduct, currency: e.target.value })} />
            <select className="select" value={editProduct.status} onChange={(e) => setEditProduct({ ...editProduct, status: e.target.value })}>
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <Button variant="muted" onClick={() => void onUpdateProduct()}>{labels.updateDiscount}</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold">{labels.update}</h3>
        <div className="mt-3 space-y-2">
          <select
            className="select"
            value={editCategory.id}
            onChange={(e) => {
              const found = categories.find((category) => asText(category.id) === e.target.value);
              setEditCategory({
                id: e.target.value,
                name: asText(found?.name),
                slug: asText(found?.slug),
              });
            }}
          >
            <option value="">{labels.createCategory}</option>
            {categories.map((category) => (
              <option key={asText(category.id)} value={asText(category.id)}>
                {asText(category.name)}
              </option>
            ))}
          </select>
          <input className="input" placeholder={labels.name} value={editCategory.name} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} />
          <input className="input" placeholder={labels.slug} value={editCategory.slug} onChange={(e) => setEditCategory({ ...editCategory, slug: e.target.value })} />
          <Button variant="muted" onClick={() => void onUpdateCategory()}>{labels.updateShipping}</Button>
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

      <Card className="lg:col-span-2">
        <h3 className="text-lg font-bold">{labels.action}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select className="select" value={categoryLink.productId} onChange={(e) => setCategoryLink({ ...categoryLink, productId: e.target.value })}>
            <option value="">{labels.selectProduct}</option>
            {products.map((product) => (
              <option key={asText(product.id)} value={asText(product.id)}>
                {asText(product.name)}
              </option>
            ))}
          </select>
          <select className="select" value={categoryLink.categoryId} onChange={(e) => setCategoryLink({ ...categoryLink, categoryId: e.target.value })}>
            <option value="">{labels.createCategory}</option>
            {categories.map((category) => (
              <option key={asText(category.id)} value={asText(category.id)}>
                {asText(category.name)}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant="muted" onClick={() => void onLinkProductCategory()}>{labels.add}</Button>
            <Button variant="danger" onClick={() => void onUnlinkProductCategory()}>{labels.delete}</Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
