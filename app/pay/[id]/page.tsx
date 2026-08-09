"use client";

// Client pay page — CORE STUB. Module zone app/(modules)/pay can replace this visual;
// keep the PATCH call exactly as-is (it triggers the agent payout).

import { useEffect, useState, use } from "react";

type Inv = {
  id: string; clientName: string; amount: number; currency: string;
  description: string; status: string; walletAddress: string;
};

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inv, setInv] = useState<Inv | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then((r) => r.json()).then((j) => {
      setInv(j.error ? null : j);
      if (j.status === "paid" || j.status === "payout_sent") setDone(true);
    });
  }, [id]);

  if (!inv) return <main className="p-10 text-center text-neutral-400">Invoice not found.</main>;

  const pay = async () => {
    setBusy(true);
    await fetch(`/api/invoices/${id}`, { method: "PATCH" });
    setBusy(false);
    setDone(true);
  };

  return (
    <main className="mx-auto max-w-md p-8 space-y-6 text-center">
      <h1 className="text-2xl font-bold">Invoice from Sami Trabelsi</h1>
      <div className="rounded-2xl border p-6 space-y-2 shadow-sm">
        <p className="text-neutral-500">{inv.description}</p>
        <p className="text-4xl font-bold">{inv.amount} {inv.currency}</p>
        <p className="text-xs text-neutral-400 break-all">Pay with USDC (Polygon): {inv.walletAddress}</p>
      </div>
      {done ? (
        <div className="rounded-2xl bg-emerald-50 p-6">
          <p className="text-2xl">✅</p>
          <p className="font-semibold text-emerald-700">Payment received — thank you!</p>
          <p className="text-sm text-emerald-600">Sami's agent has been notified and is settling the funds.</p>
        </div>
      ) : (
        <button onClick={pay} disabled={busy}
          className="w-full rounded-xl bg-emerald-600 py-3 text-lg font-semibold text-white disabled:opacity-50">
          {busy ? "Processing…" : `Pay ${inv.amount} ${inv.currency}`}
        </button>
      )}
      <p className="text-xs text-neutral-400">Powered by Khlasni · payments via Gravv</p>
    </main>
  );
}
