import { NextRequest, NextResponse } from "next/server";
import { loadInvoice, saveInvoice, addEvent } from "@/lib/server/store";
import { sendEmail } from "@/lib/mail";

const NUDGES = (name: string, link: string) => [
  `Hi ${name}, quick nudge — the invoice is still open. You can settle it here: ${link}\nHappy to answer any questions.\n\n— Khlasni, on behalf of Sami Trabelsi`,
  `Hi ${name}, following up again — the invoice is a few days old now. Payment link: ${link}\nLet me know if something's blocking it.\n\n— Khlasni, on behalf of Sami Trabelsi`,
  `${name}, this is a firmer follow-up: the invoice is now overdue. Please settle it today: ${link}\nOr tell me what's wrong on your end and I'll pass it on.\n\n— Khlasni, on behalf of Sami Trabelsi`,
];

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await loadInvoice(id);
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (inv.status === "paid" || inv.status === "payout_sent") {
    return NextResponse.json(inv); // nothing to chase
  }
  const priorNudges = inv.events.filter((e) => e.actor === "agent" && /follow-up|nudge/i.test(e.text)).length;
  const body = NUDGES(inv.clientName, inv.payUrl)[Math.min(priorNudges, 2)];
  const sent = inv.clientEmail ? await sendEmail(inv.clientEmail, `Nudge — invoice still open`, body) : false;
  addEvent(inv, {
    actor: "agent",
    text: sent
      ? `Follow-up #${priorNudges + 1} emailed to ${inv.clientEmail}.`
      : `Follow-up #${priorNudges + 1} drafted — send it via WhatsApp: "${body.slice(0, 60)}…"`,
  });
  await saveInvoice(inv);
  return NextResponse.json(inv);
}
