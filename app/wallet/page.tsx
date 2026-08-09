"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import RequireAuth from "@/components/RequireAuth";
import { useStore } from "@/lib/store";

type GravvAccount = {
  id: string; label: string; balance: string; currency: string; status: string;
  network: string; address: string; assets: { symbol: string; balance: string }[];
};

const CCY_LABEL: Record<string, string> = {
  TND: "Tunisian Dinar",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
};

export default function Wallet() {
  const { wallet, invoices } = useStore();
  const totalTND = wallet.find((b) => b.currency === "TND")?.amount ?? 0;
  const settledCount = invoices.filter((i) => i.status === "paid").length;
  const [gravvAccounts, setGravvAccounts] = useState<GravvAccount[]>([]);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((j) => setGravvAccounts(j.accounts ?? []))
      .catch(() => {});
  }, []);

  return (
    <RequireAuth>
      <div className="flex-1">
        <Nav active="wallet" />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h1 className="font-display text-3xl">Gravv wallet</h1>
          <p className="text-muted mt-1 text-sm">
            Everything clients pay lands here, converted automatically.
          </p>

          <div className="mt-8 rounded-lg border border-white/10 bg-ink-2 px-6 py-6">
            <p className="text-xs uppercase tracking-widest text-muted">
              Available balance
            </p>
            <p className="font-display text-5xl mt-2 text-gold">
              {totalTND.toLocaleString()}
              <span className="text-2xl text-muted ml-2">TND</span>
            </p>
            <p className="text-xs text-muted mt-2">
              {settledCount} invoice{settledCount === 1 ? "" : "s"} settled through Khlasni
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {wallet.map((b) => (
              <div
                key={b.currency}
                className="rounded-lg border border-white/10 px-5 py-4"
              >
                <p className="text-xs text-muted">{CCY_LABEL[b.currency]}</p>
                <p className="font-mono-tabular text-xl mt-1">
                  {b.amount.toLocaleString()}{" "}
                  <span className="text-sm text-muted">{b.currency}</span>
                </p>
              </div>
            ))}
          </div>

          {gravvAccounts.length > 0 && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-widest text-muted mb-3">
                Live Gravv account <span className="text-settled">● connected</span>
              </p>
              {gravvAccounts.map((a) => (
                <div key={a.id} className="rounded-lg border border-white/10 bg-ink-2 px-5 py-4 mb-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ivory">{a.label}</p>
                    <span className={`text-xs font-mono-tabular uppercase ${a.status === "active" ? "text-settled" : "text-muted"}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="font-mono-tabular text-xl mt-1">
                    {a.balance} <span className="text-sm text-muted">{a.currency}</span>
                  </p>
                  <p className="text-[11px] text-muted mt-2 font-mono-tabular break-all">
                    {a.network} · {a.address}
                  </p>
                  {a.assets.length > 0 && (
                    <p className="text-[11px] text-muted mt-1 font-mono-tabular">
                      {a.assets.map((s) => `${s.symbol} ${s.balance}`).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted leading-relaxed max-w-md">
                This block is a live read of the Gravv sandbox accounts API — the
                same account the agent settles into. Balances update as transfers land.
              </p>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
