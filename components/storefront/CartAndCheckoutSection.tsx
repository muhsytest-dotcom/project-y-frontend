import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  line_total_amount_minor: number;
};

type Props = {
  cart: Record<string, unknown> | null;
  cartItems: CartItem[];
  labels: {
    cart: string;
    emptyCart: string;
    qty: string;
    remove: string;
    getQuote: string;
    checkout: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingName: string;
    addressLine1: string;
    city: string;
    countryCode: string;
    placeOrder: string;
  };
  discountCode: string;
  setDiscountCode: (value: string) => void;
  quote: Record<string, unknown> | null;
  getQuote: () => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  deleteCartItem: (itemId: string) => Promise<void>;
  getProductName: (productId: string) => string;
  customer: { full_name: string; email: string; phone: string };
  setCustomer: (next: { full_name: string; email: string; phone: string }) => void;
  shipping: {
    shipping_name: string;
    shipping_phone: string;
    shipping_address_line1: string;
    shipping_city: string;
    shipping_country_code: string;
  };
  setShipping: (next: {
    shipping_name: string;
    shipping_phone: string;
    shipping_address_line1: string;
    shipping_city: string;
    shipping_country_code: string;
  }) => void;
  checkout: () => Promise<void>;
  amount: (minor: number | undefined, currencyCode: string | undefined) => string;
};

export function CartAndCheckoutSection({
  cart,
  cartItems,
  labels,
  discountCode,
  setDiscountCode,
  quote,
  getQuote,
  updateCartItem,
  deleteCartItem,
  getProductName,
  customer,
  setCustomer,
  shipping,
  setShipping,
  checkout,
  amount,
}: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-bold">{labels.cart}</h2>
        {cartItems.length === 0 ? (
          <div className="mt-3"><EmptyState title={labels.emptyCart} /></div>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {cartItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-[#d9ddcf] bg-white p-3">
                <p className="font-semibold">{getProductName(item.product_id)}</p>
                <p className="soft mt-1">{labels.qty} {item.quantity} • {amount(item.line_total_amount_minor, String(cart?.currency_code || ""))}</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="muted" onClick={() => void updateCartItem(item.id, Math.max(1, item.quantity - 1))}>-1</Button>
                  <Button variant="muted" onClick={() => void updateCartItem(item.id, item.quantity + 1)}>+1</Button>
                  <Button variant="danger" onClick={() => void deleteCartItem(item.id)}>{labels.remove}</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 space-y-2">
          <input className="input" placeholder="Discount code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
          <Button onClick={() => void getQuote()}>{labels.getQuote}</Button>
        </div>
        {quote ? <p className="soft mt-2 code">{JSON.stringify(quote)}</p> : null}
      </Card>

      <Card>
        <h2 className="text-xl font-bold">{labels.checkout}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className="input" placeholder={labels.customerName} value={customer.full_name} onChange={(e) => setCustomer({ ...customer, full_name: e.target.value })} />
          <input className="input" placeholder={labels.customerEmail} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
          <input className="input" placeholder={labels.customerPhone} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          <input className="input" placeholder={labels.shippingName} value={shipping.shipping_name} onChange={(e) => setShipping({ ...shipping, shipping_name: e.target.value })} />
          <input className="input sm:col-span-2" placeholder={labels.addressLine1} value={shipping.shipping_address_line1} onChange={(e) => setShipping({ ...shipping, shipping_address_line1: e.target.value })} />
          <input className="input" placeholder={labels.city} value={shipping.shipping_city} onChange={(e) => setShipping({ ...shipping, shipping_city: e.target.value })} />
          <input className="input" placeholder={labels.countryCode} value={shipping.shipping_country_code} onChange={(e) => setShipping({ ...shipping, shipping_country_code: e.target.value.toUpperCase() })} />
        </div>
        <Button className="mt-3" onClick={() => void checkout()}>{labels.placeOrder}</Button>
      </Card>
    </section>
  );
}
