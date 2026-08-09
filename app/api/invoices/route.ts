import { NextRequest, NextResponse } from "next/server";
import { saveInvoice, listInvoices, newId, addEvent, type Invoice } from "@/lib/store";
import { composeChaseMessage } from "@/lib/agent";
import { GRAVV_IDS } from "@/lib/gravv";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b?.clientName || !b?.amount || !b?.description) {
    return NextResponse.json({ error: "clientName, amount, description required" }, { status: 400 });
  }
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  const id = newId();
  const origin = req.nextUrl.origin;
  const inv: Invoice = {
    id,
    clientName: String(b.clientName),
    clientEmail: String(b.clientEmail ?? ""),
    amount,
    currency: String(b.currency ?? "USD"),
    description: String(b.description),
    status: "chasing",
    chaseMessage: "",
    payUrl: `${origin}/pay/${id}`,
    walletAddress: GRAVV_IDS.walletAddress,
    createdAt: new Date().toISOString(),
    events: [],
  };
  addEvent(inv, { actor: "system", text: `Invoice created — ${inv.amount} ${inv.currency} for ${inv.clientName}.` });
  inv.chaseMessage = await composeChaseMessage(inv, b.tone);
  addEvent(inv, { actor: "agent", text: `Payment request drafted and sent to ${inv.clientName}. I'll follow up until it's paid.` });
  await saveInvoice(inv);
  return NextResponse.json(inv);
}

export async function GET() {
  return NextResponse.json({ items: await listInvoices() });
}
