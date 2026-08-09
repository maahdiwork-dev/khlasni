// Fire-and-forget sync of the runtime invoice into the relational financial-record
// tables (khlasni_clients / khlasni_rel_invoices / khlasni_followups). Never blocks
// or fails the main flow — the jsonb store is the runtime source of truth.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Invoice } from "./store";

const g = globalThis as unknown as { __khlasniRelSb?: SupabaseClient | null };

function sb(): SupabaseClient | null {
  if (g.__khlasniRelSb !== undefined) return g.__khlasniRelSb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__khlasniRelSb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return g.__khlasniRelSb;
}

const STATUS_MAP: Record<string, string> = { pending: "draft", chasing: "sent", paid: "paid", payout_sent: "paid" };

export async function syncRelational(inv: Invoice): Promise<void> {
  const c = sb();
  if (!c) return;
  try {
    const { data: client } = await c
      .from("khlasni_clients")
      .upsert({ user_id: "sami", name: inv.clientName, email: inv.clientEmail || null }, { onConflict: "user_id,name" })
      .select("id")
      .single();
    await c.from("khlasni_rel_invoices").upsert({
      id: inv.id,
      user_id: "sami",
      client_id: client?.id ?? null,
      number: inv.id.slice(4).toUpperCase(),
      currency: inv.currency,
      amount_ht: inv.amount,
      tva: 0,
      amount_ttc: inv.amount,
      status: STATUS_MAP[inv.status] ?? "sent",
      payment_link: inv.payUrl,
      terms: { description: inv.description },
    });
    if (inv.chaseMessage) {
      await c.from("khlasni_followups").upsert(
        { id: undefined, invoice_id: inv.id, level: 1, channel: "email", body: inv.chaseMessage } as never,
        { ignoreDuplicates: true, onConflict: "invoice_id,level" },
      );
    }
  } catch (e) {
    console.error("relational sync failed (non-fatal):", e instanceof Error ? e.message : e);
  }
}
