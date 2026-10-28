import type { Metadata } from "next";
import { CartClient } from "@/components/cart-client";
export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };
export default function CartPage() { return <CartClient />; }
