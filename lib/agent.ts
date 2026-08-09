// Agent orchestration: Mastra-first, template fallback. The demo NEVER dies here —
// every path resolves the invoice even if Mastra or Gravv sandbox refuses.

import { gravvEnabled } from "./gravv";
import { addEvent, type Invoice } from "./store";
import { khlasniAgent, toolTraces } from "./mastra/khlasni-agent";

const hasLLM = () => !!process.env.ANTHROPIC_API_KEY;

// Hard ceiling on any LLM run — a hung upstream must never hang the demo.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

function templateChase(inv: Invoice): string {
  return (
    `Hi ${inv.clientName},\n\nHope you're doing well! Invoice #${inv.id.slice(4).toUpperCase()} ` +
    `for "${inv.description}" (${inv.amount} ${inv.currency}) is ready.\n\n${inv.payUrl}\n\n` +
    `Thanks so much — it means a lot to get this settled.\n\n— sent by Khlasni on behalf of Sami Trabelsi`
  );
}

export async function composeChaseMessage(inv: Invoice, tone = "friendly"): Promise<string> {
  if (!hasLLM()) return templateChase(inv);
  try {
    const res = await withTimeout(khlasniAgent.generate(
      `Write the payment-request message for this invoice. Tone: ${tone}. ` +
      `Client: ${inv.clientName}. Work: "${inv.description}". Amount: ${inv.amount} ${inv.currency}. ` +
      `Pay link: ${inv.payUrl}. Output only the message body — no preamble.`,
    ), 15000);
    return res.text?.trim() || templateChase(inv);
  } catch {
    return templateChase(inv);
  }
}

export async function runPayout(inv: Invoice): Promise<void> {
  addEvent(inv, { actor: "agent", text: `Payment detected for ${inv.amount} ${inv.currency} — settling via Gravv.` });

  let transferOk = false;
  if (hasLLM() && gravvEnabled()) {
    try {
      const before = toolTraces.length;
      const res = await withTimeout(khlasniAgent.generate(
        `Invoice ${inv.id} ("${inv.description}", ${inv.amount} ${inv.currency}) was just paid by ${inv.clientName}. ` +
        `Settle it now: check rates, execute the transfer (client_reference: ${inv.id}), then report.`,
        { maxSteps: 5 },
      ), 25000);
      for (const t of toolTraces.slice(before)) {
        if (t.call === "POST /v1/transfer" && t.ok) transferOk = true;
        addEvent(inv, {
          actor: "agent",
          text: t.ok ? `Gravv call succeeded.` : `Gravv declined this call (${t.detail ?? "error"}).`,
          gravv: { call: t.call, ok: t.ok, detail: t.detail },
        });
      }
      if (res.text) addEvent(inv, { actor: "agent", text: res.text.trim() });
    } catch (e) {
      addEvent(inv, {
        actor: "agent",
        text: `Agent run interrupted (${e instanceof Error ? e.message.slice(0, 60) : "unknown"}) — invoice recorded, payout deferred.`,
      });
    }
  } else {
    addEvent(inv, { actor: "agent", text: "Payment recorded (simulation mode — no live rails configured)." });
  }

  inv.status = "payout_sent";
  addEvent(inv, {
    actor: "agent",
    text: transferOk
      ? `Done. ${inv.amount} ${inv.currency} is on its way to Sami's account via Gravv. Invoice closed.`
      : `Invoice marked settled. Live Gravv transfer did not complete (see log above for the exact reason) — payout deferred. Invoice closed.`,
  });
}
