import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Frequently asked questions", description: "Find answers about orders, delivery and customer support at SaversBD." };

const sections = [
  { title: "Orders & payment", items: [
    { q: "How do I place an order?", a: "Browse the shop, open the product you want, choose the quantity and add it to your cart. Review your cart and follow the checkout steps to place your order." },
    { q: "Is cash on delivery available?", a: "Cash on delivery is available. The options available for your order will be shown during checkout." },
    { q: "How can I check my order?", a: "Visit your account to review your orders. If you need help with an order, contact our support team and include your order number." },
  ] },
  { title: "Delivery", items: [
    { q: "Where do you deliver?", a: "SaversBD delivers across Bangladesh. Availability and delivery options for your address are confirmed during checkout." },
    { q: "How much does delivery cost?", a: "Delivery charges depend on the order and delivery location. Please review the delivery options and charges at checkout before placing your order." },
    { q: "When will my order arrive?", a: "Delivery times depend on your location and product availability. If you need an estimate for a particular order, please contact our support team." },
  ] },
  { title: "Returns & support", items: [
    { q: "Can I return or exchange a product?", a: "Please contact our support team with your order number and details of the product. The team can explain the applicable return or exchange process." },
    { q: "What if my order arrives damaged or incorrect?", a: "Contact our support team as soon as possible with your order number and details of the issue. Photos of the item and packaging can help the team review your request." },
    { q: "How do I contact SaversBD?", a: "Visit the Contact page for the available ways to reach our support team." },
  ] },
];

export default function FaqPage() {
  return <main className="container-page py-8 md:py-12"><p className="text-sm text-muted"><Link href="/">Home</Link> / FAQ</p><header className="mt-8 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Here to help</p><h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">Frequently asked questions</h1><p className="mt-3 leading-relaxed text-muted">Find information about ordering, delivery and getting help with your purchase.</p></header><div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"><div className="space-y-6">{sections.map(section => <section key={section.title} className="rounded-2xl border border-line bg-white p-5 sm:p-6"><h2 className="text-lg font-bold text-ink">{section.title}</h2><div className="mt-3 divide-y divide-line">{section.items.map(item => <details key={item.q} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">{item.q}<span aria-hidden="true" className="text-xl font-normal text-brand group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p></details>)}</div></section>)}</div><aside className="rounded-2xl bg-haze p-6"><h2 className="text-lg font-bold text-ink">Still need help?</h2><p className="mt-2 text-sm leading-relaxed text-muted">Our team can help with an order, product or delivery question.</p><Link href="/contact" className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#2060a0] px-4 text-sm font-bold text-white">Contact us</Link></aside></div></main>;
}
