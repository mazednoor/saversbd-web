import { NextRequest, NextResponse } from "next/server";
import { address, CART_COOKIE, cartResponse, cartSession, CommerceError, exclusive, fail, integer, ORDER_COOKIE, PRIVATE_HEADERS, readBody, record, requireSameOrigin, storeRequest, text } from "@/lib/commerce-server";
import type { StoreCart } from "@/lib/commerce-types";
import { getProductVariations } from "@/lib/woo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try { const { cart, token } = await cartSession(request); return cartResponse(cart, token); }
  catch (error) { return fail(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const input = await readBody(request);
    const action = text(input.action, 40);
    if (action === "reset-session") {
      const response = NextResponse.json({ reset: true }, { headers: PRIVATE_HEADERS });
      response.cookies.delete(CART_COOKIE); response.cookies.delete(ORDER_COOKIE);
      return response;
    }
    const data = record(input.data);
    let body: Record<string, unknown>;
    switch (action) {
      case "add-item": {
        const parent = integer(data.id);
        let id = parent;
        let variation: { attribute: string; value: string }[] = [];
        if (data.variation !== undefined) {
          const variantId = integer(data.variation);
          const choice = (await getProductVariations(parent, true)).find((choice) => choice.id === variantId);
          if (!choice || !choice.inStock || !choice.purchasable) throw new CommerceError("This option is no longer available. Choose another option.");
          id = choice.id;
          variation = Object.entries(choice.attributes).map(([attribute, value]) => ({ attribute, value }));
        }
        body = { id, quantity: integer(data.quantity, 1, 20), variation };
        break;
      }
      case "update-item": body = { key: text(data.key, 100), quantity: integer(data.quantity, 1, 9999) }; break;
      case "remove-item": body = { key: text(data.key, 100) }; break;
      case "apply-coupon": case "remove-coupon": body = { code: text(data.code, 100) }; break;
      case "update-customer": body = { billing_address: address(data.billing_address), shipping_address: address(data.shipping_address) }; break;
      case "select-shipping-rate": body = { package_id: integer(data.package_id, 0, 100), rate_id: text(data.rate_id, 150) }; break;
      default: throw new CommerceError("Unknown cart action.");
    }
    const { token } = await cartSession(request);
    return await exclusive(token, async () => {
      const result = await storeRequest<StoreCart>(`/cart/${action}`, token, body);
      const response = cartResponse(result.data, result.token ?? token);
      response.cookies.delete(ORDER_COOKIE);
      return response;
    });
  } catch (error) { return fail(error); }
}
