import { NextRequest, NextResponse } from "next/server";
import { cartSession, cartSignature, CommerceError, exclusive, fail, ORDER_COOKIE, PRIVATE_HEADERS, readBody, requireSameOrigin, sessionToken, setPrivateCookie, storeRequest, text, unseal } from "@/lib/commerce-server";
import type { StoreCart } from "@/lib/commerce-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
interface PreparedOrder { id: number; key: string; email: string; signature: string; token: string }
interface CheckoutResult { order_id: number; order_key: string; order_number?: string; status: string; payment_result?: { payment_status: string } }
interface OrderResult { id: number; number?: string; status: string; items: unknown[]; totals: unknown }
const received = new Set(["processing", "completed", "on-hold"]);
const uncertain = "Your order may have been received. Check its status below before trying again.";

function ensureReady(cart: StoreCart) {
  if (!cart.items.length) throw new CommerceError("Your cart is empty.", 409);
  if (cart.errors?.length) throw new CommerceError(cart.errors[0].message.replace(/<[^>]*>/g, ""), 409);
  const billing = cart.billing_address;
  if (!billing?.first_name || !billing.last_name || !billing.address_1 || !billing.city || !billing.state || !billing.email || !billing.phone) {
    throw new CommerceError("Complete your contact and delivery details, then update delivery.");
  }
  if (billing.country !== "BD" || cart.shipping_address.country !== "BD") throw new CommerceError("Delivery is available within Bangladesh.");
  if (cart.needs_shipping && (!cart.has_calculated_shipping || !cart.shipping_rates.length || cart.shipping_rates.some((p) => !p.shipping_rates.some((r) => r.selected)))) {
    throw new CommerceError("Choose an available delivery method before placing your order.");
  }
  if (!cart.payment_methods.includes("cod")) throw new CommerceError("Cash on delivery is not available for this order. Please contact the store.");
}
async function readOrder(order: PreparedOrder) {
  return (await storeRequest<OrderResult>(`/order/${order.id}?${new URLSearchParams({ key: order.key, billing_email: order.email })}`, order.token)).data;
}
function success() { return NextResponse.json({ received: true, next: "/order-confirmation" }, { headers: PRIVATE_HEADERS }); }

/** Only this browser's encrypted receipt can retrieve its order; no IDs or keys from the URL. */
export async function GET(request: NextRequest) {
  try {
    const order = unseal<PreparedOrder>(request.cookies.get(ORDER_COOKIE)?.value);
    if (!order || sessionToken(request) !== order.token) throw new CommerceError("No recent order was found in this browser.", 404);
    const data = await readOrder(order);
    return NextResponse.json({ id: data.id, number: data.number ?? String(data.id), status: data.status,
      received: received.has(data.status), items: data.items, totals: data.totals }, { headers: PRIVATE_HEADERS });
  } catch (error) { return fail(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const input = await readBody(request);
    const action = text(input.action, 40);
    const existing = unseal<PreparedOrder>(request.cookies.get(ORDER_COOKIE)?.value);
    if (action === "place-order" && existing && sessionToken(request) === existing.token) {
      return await exclusive(existing.token, async () => {
        // Checking the prepared WooCommerce order prevents re-submitting after a lost response/restart.
        const current = await readOrder(existing);
        if (received.has(current.status)) return success();
        if (current.status !== "checkout-draft") throw new CommerceError(uncertain, 409, "check_order_status");
        if (input.confirmed !== true) throw new CommerceError("Confirm your order before continuing.");
        const { cart, token } = await cartSession(request);
        ensureReady(cart);
        if (cartSignature(cart) !== existing.signature || input.expected_total !== cart.totals.total_price) {
          throw new CommerceError("Your cart or delivery total changed. Review the updated total before ordering.", 409, "cart_changed");
        }
        let result: CheckoutResult;
        try {
          result = (await storeRequest<CheckoutResult>("/checkout", token, {
            billing_address: cart.billing_address, shipping_address: cart.shipping_address,
            payment_method: "cod", payment_data: [], create_account: false,
            customer_note: text(input.customer_note ?? "", 1000), expected_total: cart.totals.total_price,
          }, 45_000)).data;
        } catch (error) {
          // Never automatically retry an order mutation after an ambiguous network failure.
          if (!(error instanceof CommerceError) || error.status >= 500) throw new CommerceError(uncertain, 503, "check_order_status");
          throw error;
        }
        if (result.order_id !== existing.id || !received.has(result.status) || result.payment_result?.payment_status === "failure") {
          throw new CommerceError(uncertain, 409, "check_order_status");
        }
        return success();
      });
    }
    if (action !== "prepare-order") throw new CommerceError("Review your order before placing it.", 409);
    const { cart, token } = await cartSession(request);
    return await exclusive(token, async () => {
      ensureReady(cart);
      if (input.expected_total !== cart.totals.total_price) throw new CommerceError("Your total changed. Refresh and review your order.", 409, "cart_changed");
      if (existing && existing.token === token) {
        const current = await readOrder(existing);
        if (received.has(current.status)) return success();
        if (current.status !== "checkout-draft") throw new CommerceError(uncertain, 409, "check_order_status");
      }
      const draft = (await storeRequest<CheckoutResult>("/checkout", token)).data;
      if (!draft.order_id || !draft.order_key || draft.status !== "checkout-draft") throw new CommerceError("Unable to prepare your order.", 502);
      const response = NextResponse.json({ prepared: true }, { headers: PRIVATE_HEADERS });
      setPrivateCookie(response, ORDER_COOKIE, { id: draft.order_id, key: draft.order_key, email: cart.billing_address.email!,
        signature: cartSignature(cart), token } satisfies PreparedOrder);
      return response;
    });
  } catch (error) { return fail(error); }
}
