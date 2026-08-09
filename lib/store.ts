// In-memory store. No DB — hackathon scope. Survives across requests via globalThis
// (next dev/prod share the module instance per server process).

export type InvoiceStatus = "pending" | "chasing" | "paid" | "payout_sent";

export interface AgentEvent {
  at: string;
  actor: "agent" | "system" | "client";
  text: string;
  gravv?: { call: string; ok: boolean; detail?: string };
}

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  description: string;
  status: InvoiceStatus;
  chaseMessage: string;
  payUrl: string;           // in-product client pay page
  walletAddress: string;    // Gravv deposit address shown to the client
  createdAt: string;
  paidAt?: string;
  events: AgentEvent[];     // the agent's visible activity log — demo gold
}

const g = globalThis as unknown as { __khlasni?: Map<string, Invoice> };
export const invoices: Map<string, Invoice> = (g.__khlasni ??= new Map());

export function addEvent(inv: Invoice, e: Omit<AgentEvent, "at">) {
  inv.events.push({ at: new Date().toISOString(), ...e });
}

export function newId() {
  return `inv_${Math.random().toString(36).slice(2, 9)}`;
}
