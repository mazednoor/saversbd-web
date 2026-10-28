"use client";
import { useState, type FormEvent } from "react";

export function ContactForm({ wordpressUrl }: { wordpressUrl: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const field = "mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-sm placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-blue-600";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending"); setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch(`${wordpressUrl}/wp-json/saversbd/v1/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "We could not send your message. Please try again.");
      form.reset(); setState("sent");
    } catch (e) { setState("idle"); setError(e instanceof Error ? e.message : "We could not send your message. Please try again."); }
  }
  return <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
    <label className="text-sm font-semibold text-ink">Full name<input name="name" required maxLength={120} autoComplete="name" className={field} /></label>
    <label className="text-sm font-semibold text-ink">Email address<input name="email" type="email" required maxLength={254} autoComplete="email" className={field} /></label>
    <label className="text-sm font-semibold text-ink sm:col-span-2">Order number <span className="font-normal text-muted">(optional)</span><input name="order" maxLength={80} className={field} /></label>
    <label className="text-sm font-semibold text-ink sm:col-span-2">Your message<textarea name="message" required minLength={10} maxLength={5000} rows={5} className="mt-2 w-full rounded-xl border border-line bg-white p-4 text-sm focus-visible:outline-2 focus-visible:outline-blue-600" /></label>
    <label className="hidden" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <button disabled={state === "sending"} className="h-12 rounded-full bg-[#2060a0] px-6 text-sm font-bold text-white disabled:opacity-60 sm:w-fit">{state === "sending" ? "Sending…" : "Send message"}</button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
    {state === "sent" && <p role="status" className="text-sm text-green-700 sm:col-span-2">Your message was sent. Thank you for contacting us.</p>}
  </form>;
}
