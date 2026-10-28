import { decodeEntities } from "./format";

export interface Currency {
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_prefix: string;
  currency_suffix: string;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
}
export interface Address {
  first_name: string; last_name: string; company: string;
  address_1: string; address_2: string; city: string; state: string;
  postcode: string; country: string; email?: string; phone?: string;
}
export interface CartTotals extends Currency {
  total_items: string; total_discount: string; total_fees: string;
  total_shipping: string | null; total_tax: string; total_price: string;
}
export interface CartItem {
  key: string; id: number; name: string; quantity: number; permalink: string;
  quantity_limits: { minimum: number; maximum: number; multiple_of: number; editable: boolean };
  images: { thumbnail: string; src: string; alt: string }[];
  variation: { attribute: string; value: string }[];
  totals: Currency & { line_total: string; line_subtotal: string };
}
export interface ShippingPackage {
  package_id: number; name: string;
  shipping_rates: (Currency & { rate_id: string; name: string; description: string; price: string; selected: boolean })[];
}
export interface StoreCart {
  items: CartItem[]; items_count: number;
  coupons: { code: string }[]; totals: CartTotals;
  shipping_address: Address; billing_address: Address;
  shipping_rates: ShippingPackage[]; needs_shipping: boolean; has_calculated_shipping: boolean;
  payment_methods: string[]; errors: { code: string; message: string }[];
}
export interface OrderReceipt {
  id: number; number: string; status: string;
  items: CartItem[]; totals: CartTotals;
}
export function money(value: string | null, currency: Currency): string {
  if (value === null) return "Not calculated";
  const minor = currency.currency_minor_unit ?? 2;
  const fixed = (Number(value) / 10 ** minor).toFixed(minor);
  const [whole, fraction] = fixed.split(".");
  const body = whole.replace(/\B(?=(\d{3})+(?!\d))/g, currency.currency_thousand_separator || ",")
    + (fraction ? (currency.currency_decimal_separator || ".") + fraction : "");
  return decodeEntities(`${currency.currency_prefix ?? ""}${body}${currency.currency_suffix ?? ""}`).trim();
}
