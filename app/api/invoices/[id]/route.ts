import { NextRequest, NextResponse } from "next/server";
import { invoices, addEvent } from "@/lib/store";
import { runPayout } from "@/lib/agent";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = invoices.get(id);
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(inv);
}

// PATCH marks the invoice paid (called from the client pay page) and hands off to the agent.
export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = invoices.get(id);
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (inv.status === "chasing" || inv.status === "pending") {
    inv.status = "paid";
    inv.paidAt = new Date().toISOString();
    addEvent(inv, { actor: "client", text: `${inv.clientName} completed payment of ${inv.amount} ${inv.currency}.` });
    await runPayout(inv);
  }
  return NextResponse.json(inv);
}
