export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { saveInvoice, listInvoices, newId, addEvent, type Invoice } from "@/lib/server/store";
import { composeChaseMessage } from "@/lib/agent";
import { sendEmail } from "@/lib/mail";
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
  inv.chaseMessage = await composeChaseMessage(inv, b.tone, typeof b.brief === "string" ? b.brief.slice(0, 1500) : undefined);
  if (inv.clientEmail) {
    const sent = await sendEmail(inv.clientEmail, `Invoice — ${inv.description}`, inv.chaseMessage);
    addEvent(inv, {
      actor: "agent",
      text: sent
        ? `Payment request emailed to ${inv.clientEmail}. I'll follow up until it's paid.`
        : `Email to ${inv.clientEmail} didn't go through — payment request ready to send manually.`,
    });
  } else {
    addEvent(inv, { actor: "agent", text: `Payment request drafted for ${inv.clientName} — send it via WhatsApp from the dashboard.` });
  }
  await saveInvoice(inv);
  return NextResponse.json(inv);
}

export async function GET() {
  return NextResponse.json({ items: await listInvoices() });
}
