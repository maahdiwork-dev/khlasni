import { NextRequest, NextResponse } from "next/server";
import { loadInvoice, saveInvoice, addEvent } from "@/lib/store";
import { runPayout } from "@/lib/agent";
import { sendEmail } from "@/lib/mail";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await loadInvoice(id);
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(inv);
}

// PATCH marks the invoice paid (called from the client pay page) and hands off to the agent.
export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await loadInvoice(id);
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (inv.status === "chasing" || inv.status === "pending") {
    inv.status = "paid";
    inv.paidAt = new Date().toISOString();
    addEvent(inv, { actor: "client", text: `${inv.clientName} completed payment of ${inv.amount} ${inv.currency}.` });
    await saveInvoice(inv); // persist "paid" immediately so the dashboard sees it while the agent runs
    await runPayout(inv);
    if (inv.clientEmail) {
      const sent = await sendEmail(
        inv.clientEmail,
        `Payment received — thank you`,
        `Hi ${inv.clientName},\n\nConfirming we received your payment of ${inv.amount} ${inv.currency} for "${inv.description}". Receipt reference: ${inv.id.slice(4).toUpperCase()}.\n\nThank you!\n\n— Khlasni, on behalf of Sami Trabelsi`,
      );
      if (sent) addEvent(inv, { actor: "agent", text: `Receipt emailed to ${inv.clientEmail}.` });
    }
    await saveInvoice(inv);
  }
  return NextResponse.json(inv);
}
