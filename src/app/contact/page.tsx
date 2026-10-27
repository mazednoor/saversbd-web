import type { Metadata } from "next";
import Link from "next/link";
import { WP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with SaversBD about your order, delivery or products.",
};

export default function ContactPage() {
  return (
    <main className="container-page py-8 md:py-12">
      <p className="text-sm text-muted"><Link href="/" className="hover:text-ink">Home</Link> / Contact</p>
      <header className="mt-8 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">We’re here for you</p>
        <h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">How can we help?</h1>
        <p className="mt-3 leading-relaxed text-muted">Have a question about an order, a product or delivery? Get in touch with the SaversBD team.</p>
      </header>
      <div className="mt-8 grid gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <aside className="rounded-2xl bg-haze p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Let’s talk</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">Share the details of your question and include your order number if you have one.</p>
          <div className="mt-6 space-y-5 border-t border-line pt-5">
            <div><p className="font-semibold text-ink">Order support</p><p className="mt-1 text-sm text-muted">Questions about an existing order or delivery.</p></div>
            <div><p className="font-semibold text-ink">Product questions</p><p className="mt-1 text-sm text-muted">Need more information before placing an order?</p></div>
            <div><p className="font-semibold text-ink">Quick answers</p><Link href="/faq" className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-4">Browse frequently asked questions</Link></div>
          </div>
        </aside>
        <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_14px_40px_-30px_rgba(4,0,55,.35)] sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#2060a0]" aria-hidden="true"><svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <h2 className="mt-5 text-2xl font-bold text-ink">Send us a message</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">Use our contact form to tell us how we can help. You can include your order number for faster support.</p>
          <a href={`${WP_URL}/contact/`} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#2060a0] px-6 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Open contact form <span aria-hidden="true" className="ml-2">→</span></a>
          <p className="mt-4 text-xs leading-relaxed text-muted">The form opens on the SaversBD WordPress site.</p>
        </section>
      </div>
    </main>
  );
}
