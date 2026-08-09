"use client";

// Client-facing payment page — what the freelancer's client (or a judge's phone)
// sees. Matches the ticket design language. PATCH here triggers the agent payout.

import { useEffect, useState, use } from "react";

type Inv = {
  id: string; clientName: string; amount: number; currency: string;
  description: string; status: string; walletAddress: string;
};

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inv, setInv] = useState<Inv | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) return setNotFound(true);
        setInv(j);
        if (j.status === "paid" || j.status === "payout_sent") setDone(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const pay = async () => {
    setBusy(true);
    try {
      await fetch(`/api/invoices/${id}`, { method: "PATCH" });
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1">
      <header className="border-b border-white/10">
        <div className="max-w-xl mx-auto px-6 h-16 flex items-center">
          <span className="font-display text-xl tracking-tight">
            khlas<span className="text-chase">ni</span>
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-12">
        {notFound && (
          <p className="text-center text-muted py-16">Invoice not found.</p>
        )}

        {inv && (
          <>
            <p className="font-mono-tabular text-xs tracking-[0.2em] text-gold uppercase text-center">
              Payment request
            </p>
            <h1 className="font-display text-2xl text-center mt-2">
              Sami Trabelsi sent you an invoice
            </h1>

            <div className="mt-8 relative flex text-ink overflow-hidden rounded-lg shadow-2xl shadow-black/50">
              <div className="w-3 perf-edge bg-paper shrink-0" />
              <div className="flex-1 bg-paper px-6 py-6">
                <p className="font-mono-tabular text-xs tracking-wider text-ink/50">
                  {inv.id.slice(4).toUpperCase()}
                </p>
                <h2 className="font-display text-xl leading-tight mt-1">
                  {inv.description}
                </h2>
                <p className="text-sm text-ink/60 mt-1">For {inv.clientName}</p>

                <div className="mt-5 border-t border-dashed border-paper-line pt-4 font-mono-tabular">
                  <span className="text-4xl font-semibold">
                    {inv.amount.toLocaleString()}
                  </span>
                  <span className="text-sm text-ink/50 ml-1">{inv.currency}</span>
                </div>

                <p className="mt-3 text-[11px] text-ink/40 font-mono-tabular break-all">
                  USDC · Polygon · {inv.walletAddress}
                </p>
              </div>
            </div>

            {done ? (
              <div className="mt-8 rounded-lg border border-settled/40 bg-settled/10 px-6 py-6 text-center">
                <span className="inline-flex items-center justify-center font-mono-tabular text-xs tracking-[0.18em] font-bold uppercase border-2 rounded px-2 py-1 -rotate-6 text-settled border-settled">
                  PAID
                </span>
                <p className="mt-3 font-display text-lg text-ivory">
                  Payment received — thank you.
                </p>
                <p className="mt-1 text-sm text-muted">
                  Sami&apos;s agent has been notified and is settling the funds
                  through Gravv.
                </p>
              </div>
            ) : (
              <button
                onClick={pay}
                disabled={busy}
                className="mt-8 w-full rounded-full bg-chase text-ink font-medium text-lg py-3.5 hover:brightness-110 transition disabled:opacity-50"
              >
                {busy ? "Processing…" : `Pay ${inv.amount.toLocaleString()} ${inv.currency}`}
              </button>
            )}

            <p className="mt-6 text-center text-xs text-muted">
              Secure payment · powered by <span className="text-ivory">Gravv</span> stablecoin rails
            </p>
          </>
        )}
      </div>
    </div>
  );
}
