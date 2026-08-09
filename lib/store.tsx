"use client";

// Real store — same interface the UI was built against, now backed by /api/invoices.
// The mock seed data is gone; what you see is what's in Supabase.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChaseEvent, Invoice, WalletBalance } from "./types";
import { FX_TO_TND } from "./mock-agent";

type ServerEvent = { at: string; actor: "agent" | "client" | "system"; text: string; gravv?: { call: string; ok: boolean } };
type ServerInvoice = {
  id: string; clientName: string; clientEmail?: string; amount: number; currency: string;
  description: string; status: string; chaseMessage: string; payUrl: string;
  createdAt: string; events: ServerEvent[];
};

function mapInvoice(s: ServerInvoice): Invoice {
  let agentSeen = 0;
  const events: ChaseEvent[] = s.events.map((e, i) => {
    let label = "INFO";
    if (e.actor === "client") label = "PAID";
    else if (e.actor === "system") label = "CREATED";
    else {
      agentSeen += 1;
      label = agentSeen === 1 ? "SENT" : /follow-up|nudge|chase/i.test(e.text) ? "NUDGED" : "AGENT";
    }
    return {
      id: `${s.id}-e${i}`,
      at: e.at,
      actor: e.actor,
      label,
      message: e.gravv ? `${e.text} [${e.gravv.call}]` : e.text,
    };
  });
  const paid = s.status === "paid" || s.status === "payout_sent";
  const nudged = events.some((e) => e.label === "NUDGED");
  const cur = (["USD", "EUR", "GBP"].includes(s.currency) ? s.currency : "USD") as Invoice["currency"];
  const createdMs = Date.parse(s.createdAt);
  return {
    id: s.id,
    clientName: s.clientName,
    clientEmail: s.clientEmail ?? "",
    jobTitle: s.description,
    amount: s.amount,
    currency: cur,
    amountTND: s.amount * FX_TO_TND[cur],
    status: paid ? "paid" : nudged ? "nudged" : "sent",
    createdAt: s.createdAt,
    daysOpenAtSeed: Math.max(0, Math.floor((Date.now() - createdMs) / 86400000)),
    dueAt: new Date(createdMs + 7 * 86400000).toISOString(),
    paymentLink: s.payUrl,
    events,
  };
}

type Store = {
  invoices: Invoice[];
  wallet: WalletBalance[];
  createInvoice: (input: {
    clientName: string;
    clientEmail: string;
    jobTitle: string;
    amount: number;
    currency: Invoice["currency"];
    brief?: string;
  }) => Promise<Invoice>;
  chase: (id: string) => void;
  markPaid: (id: string) => void;
  getInvoice: (id: string) => Invoice | undefined;
};

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/invoices", { cache: "no-store" });
      const j = await r.json();
      if (Array.isArray(j.items)) setInvoices(j.items.map(mapInvoice));
    } catch {
      /* keep last known state */
    }
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [refresh]);

  const wallet: WalletBalance[] = (() => {
    const paid = invoices.filter((i) => i.status === "paid");
    const tnd = Math.round(paid.reduce((s, i) => s + i.amountTND, 0));
    const byCur = (c: Invoice["currency"]) => paid.filter((i) => i.currency === c).reduce((s, i) => s + i.amount, 0);
    return [
      { currency: "TND", amount: tnd },
      { currency: "USD", amount: byCur("USD") },
      { currency: "EUR", amount: byCur("EUR") },
    ];
  })();

  const getInvoice = useCallback((id: string) => invoices.find((i) => i.id === id), [invoices]);

  const createInvoice: Store["createInvoice"] = useCallback(async (input) => {
    const r = await fetch("/api/invoices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        amount: input.amount,
        currency: input.currency,
        description: input.jobTitle,
        brief: input.brief || undefined,
      }),
    });
    if (!r.ok) throw new Error("create failed");
    const s = (await r.json()) as ServerInvoice;
    const inv = mapInvoice(s);
    setInvoices((prev) => [inv, ...prev]);
    return inv;
  }, []);

  const chase: Store["chase"] = useCallback((id) => {
    fetch(`/api/invoices/${id}/chase`, { method: "POST" }).then(refresh).catch(() => {});
  }, [refresh]);

  const markPaid: Store["markPaid"] = useCallback((id) => {
    fetch(`/api/invoices/${id}`, { method: "PATCH" }).then(refresh).catch(() => {});
  }, [refresh]);

  return (
    <StoreCtx.Provider value={{ invoices, wallet, createInvoice, chase, markPaid, getInvoice }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
