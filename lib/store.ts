// Invoice store: Supabase-backed when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
// (required on Vercel — serverless instances don't share memory), in-memory otherwise
// (local dev without keys). Service-role client stays server-side only.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  payUrl: string;
  walletAddress: string;
  createdAt: string;
  paidAt?: string;
  events: AgentEvent[];
}

const g = globalThis as unknown as { __khlasni?: Map<string, Invoice>; __khlasniSb?: SupabaseClient | null };
const mem: Map<string, Invoice> = (g.__khlasni ??= new Map());

function sb(): SupabaseClient | null {
  if (g.__khlasniSb !== undefined) return g.__khlasniSb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__khlasniSb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return g.__khlasniSb;
}

export async function saveInvoice(inv: Invoice): Promise<void> {
  mem.set(inv.id, inv);
  const c = sb();
  if (c) {
    const { error } = await c.from("khlasni_invoices").upsert({ id: inv.id, data: inv });
    if (error) console.error("store.save failed:", error.message);
    void import("./relational").then((m) => m.syncRelational(inv)).catch(() => {});
  }
}

export async function loadInvoice(id: string): Promise<Invoice | null> {
  const c = sb();
  if (c) {
    const { data, error } = await c.from("khlasni_invoices").select("data").eq("id", id).maybeSingle();
    if (error) console.error("store.load failed:", error.message);
    if (data?.data) return data.data as Invoice;
  }
  return mem.get(id) ?? null;
}

export async function listInvoices(): Promise<Invoice[]> {
  const c = sb();
  if (c) {
    const { data, error } = await c.from("khlasni_invoices").select("data").order("created_at", { ascending: false }).limit(50);
    if (error) console.error("store.list failed:", error.message);
    if (data) return data.map((r) => r.data as Invoice);
  }
  return [...mem.values()].sort((a, z) => z.createdAt.localeCompare(a.createdAt));
}

export function addEvent(inv: Invoice, e: Omit<AgentEvent, "at">) {
  inv.events.push({ at: new Date().toISOString(), ...e });
}

export function newId() {
  return `inv_${Math.random().toString(36).slice(2, 9)}`;
}
