"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import RequireAuth from "@/components/RequireAuth";
import { useStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export default function NewInvoice() {
  const router = useRouter();
  const { createInvoice } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [knownClients, setKnownClients] = useState<{ name: string; email: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((j) => setKnownClients(j.clients ?? []))
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    jobTitle: "",
    amount: "",
    currency: "USD" as Invoice["currency"],
    brief: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName || !form.jobTitle || !form.amount) return;
    setSubmitting(true);
    try {
      // Real call — the agent writes the chase message and emails it before this resolves.
      const invoice = await createInvoice({
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        jobTitle: form.jobTitle,
        amount: Number(form.amount),
        currency: form.currency,
        brief: form.brief,
      });
      router.push(`/invoice/${invoice.id}`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth>
      <div className="flex-1">
        <Nav active="new" />
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="font-display text-3xl">Forward the job</h1>
          <p className="text-muted mt-1 text-sm">
            Tell Khlasni who the client is and what you agreed. It builds the
            invoice and sends the payment link right away.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Client name
              </label>
              <input
                required
                list="known-clients"
                value={form.clientName}
                onChange={(e) => {
                  const name = e.target.value;
                  const known = knownClients.find((c) => c.name === name);
                  if (known?.email && !form.clientEmail) {
                    setForm((f) => ({ ...f, clientName: name, clientEmail: known.email ?? "" }));
                  } else {
                    update("clientName", name);
                  }
                }}
                placeholder="Marcus Webb"
                className="w-full rounded-md bg-ink-2 border border-white/10 px-3 py-2.5 text-ivory placeholder:text-muted/60 focus:outline-none focus:border-chase"
              />
              <datalist id="known-clients">
                {knownClients.map((c) => (
                  <option key={c.name} value={c.name}>{c.email ?? ""}</option>
                ))}
              </datalist>
              {knownClients.length > 0 && (
                <p className="text-[11px] text-muted mt-1">
                  Khlasni knows {knownClients.length} of your clients — start typing to pick one.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">
                Client email
              </label>
              <input
                type="email"
                value={form.clientEmail}
                onChange={(e) => update("clientEmail", e.target.value)}
                placeholder="marcus@company.com"
                className="w-full rounded-md bg-ink-2 border border-white/10 px-3 py-2.5 text-ivory placeholder:text-muted/60 focus:outline-none focus:border-chase"
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">
                Job title
              </label>
              <input
                required
                value={form.jobTitle}
                onChange={(e) => update("jobTitle", e.target.value)}
                placeholder="Landing page redesign"
                className="w-full rounded-md bg-ink-2 border border-white/10 px-3 py-2.5 text-ivory placeholder:text-muted/60 focus:outline-none focus:border-chase"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="block text-sm text-muted mb-1.5">
                  Amount
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="950"
                  className="w-full rounded-md bg-ink-2 border border-white/10 px-3 py-2.5 font-mono-tabular text-ivory placeholder:text-muted/60 focus:outline-none focus:border-chase"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    update("currency", e.target.value as Invoice["currency"])
                  }
                  className="rounded-md bg-ink-2 border border-white/10 px-3 py-2.5 text-ivory focus:outline-none focus:border-chase"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">
                Contract or brief{" "}
                <span className="text-muted/60">(optional, paste anything)</span>
              </label>
              <textarea
                value={form.brief}
                onChange={(e) => update("brief", e.target.value)}
                rows={4}
                placeholder="Paste the client thread, scope, or contract terms — the agent reads this to fill in the gaps."
                className="w-full rounded-md bg-ink-2 border border-white/10 px-3 py-2.5 text-ivory placeholder:text-muted/60 focus:outline-none focus:border-chase resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-chase text-ink font-medium py-3 hover:brightness-110 transition disabled:opacity-60"
            >
              {submitting ? "Reading the job…" : "Generate invoice & send"}
            </button>
          </form>
        </div>
      </div>
    </RequireAuth>
  );
}
