"use client";

import { useEffect, useRef, useState } from "react";

type Ev = { at: string; actor: string; text: string; gravv?: { call: string; ok: boolean } };
type Inv = {
  id: string; clientName: string; amount: number; currency: string; description: string;
  status: string; chaseMessage: string; payUrl: string; events: Ev[];
};

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  chasing: { label: "Chasing payment", cls: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-800" },
  payout_sent: { label: "Money in your account", cls: "bg-emerald-600 text-white" },
};

export default function Dashboard() {
  const [items, setItems] = useState<Inv[]>([]);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", amount: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    const r = await fetch("/api/invoices");
    const j = await r.json();
    setItems(j.items ?? []);
  };

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, 3000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/invoices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const inv = await r.json();
    setBusy(false);
    setForm({ clientName: "", clientEmail: "", amount: "", description: "" });
    setOpen(inv.id);
    refresh();
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Khlasni</h1>
        <p className="text-sm text-neutral-500">Your money, collected. — Sami Trabelsi</p>
      </header>

      <form onSubmit={submit} className="rounded-2xl border p-5 space-y-3 shadow-sm">
        <h2 className="font-semibold">Get me paid</h2>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Client name" className="rounded-lg border p-2"
            value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          <input placeholder="Client email" className="rounded-lg border p-2"
            value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
          <input required type="number" min="1" placeholder="Amount (USD)" className="rounded-lg border p-2"
            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input required placeholder="What was the work?" className="rounded-lg border p-2"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button disabled={busy} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
          {busy ? "Agent working…" : "Send it to my agent"}
        </button>
      </form>

      <section className="space-y-4">
        {items.map((inv) => {
          const ui = STATUS_UI[inv.status] ?? { label: inv.status, cls: "bg-neutral-100 text-neutral-700" };
          return (
            <div key={inv.id} className="rounded-2xl border p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{inv.clientName} — {inv.amount} {inv.currency}</p>
                  <p className="text-sm text-neutral-500">{inv.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${ui.cls}`}>{ui.label}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <a className="underline text-blue-600" href={inv.payUrl} target="_blank">client pay page ↗</a>
                <button className="underline" onClick={() => setOpen(open === inv.id ? null : inv.id)}>
                  {open === inv.id ? "hide agent activity" : "agent activity"}
                </button>
              </div>
              {open === inv.id && (
                <div className="rounded-xl bg-neutral-50 p-4 space-y-2 text-sm">
                  <p className="whitespace-pre-wrap rounded-lg border bg-white p-3 text-neutral-700">{inv.chaseMessage}</p>
                  {inv.events.map((ev, i) => (
                    <p key={i} className="flex gap-2">
                      <span className="text-neutral-400 tabular-nums">{new Date(ev.at).toLocaleTimeString()}</span>
                      <span className={ev.actor === "agent" ? "font-medium" : ""}>
                        {ev.actor === "agent" ? "🤖 " : ev.actor === "client" ? "💳 " : "• "}{ev.text}
                        {ev.gravv && <span className={ev.gravv.ok ? "text-emerald-600" : "text-amber-600"}> [{ev.gravv.call}]</span>}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-center text-neutral-400 py-8">No invoices yet. Your agent is ready.</p>}
      </section>
    </main>
  );
}
