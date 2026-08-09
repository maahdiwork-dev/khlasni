// Khlasni's brain — a Mastra agent whose tools ARE the Gravv API.
// The agent decides; Gravv executes. ("Agentic execution" — Kredete's own words.)

import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { gravv, GRAVV_IDS } from "@/lib/gravv";

export type ToolTrace = { call: string; ok: boolean; detail?: string };
// Collected per-request so the dashboard can show real Gravv calls the agent made.
export const toolTraces: ToolTrace[] = [];

const getTransferRates = createTool({
  id: "get_transfer_rates",
  description: "Get current Gravv payout rates per country/currency (NGN, EUR, KES, XOF...). Use before settling to report the rate.",
  inputSchema: z.object({}),
  execute: async () => {
    const r = await gravv<{ items: unknown[] }>("GET", "/v1/transfer/rates");
    toolTraces.push({ call: "GET /v1/transfer/rates", ok: r.ok, detail: r.error ?? undefined });
    return r.ok ? { rates: (r.data?.items ?? []).slice(0, 12) } : { error: r.error };
  },
});

const createTransfer = createTool({
  id: "create_transfer",
  description: "Execute a Gravv transfer to settle collected funds into the freelancer's account. Call once per invoice.",
  inputSchema: z.object({
    amount: z.string().describe("Amount as decimal string, e.g. '120'"),
    description: z.string(),
    client_reference: z.string().describe("The invoice id"),
  }),
  execute: async (args) => {
    const input = ("context" in args ? (args as { context: { amount: string; description: string; client_reference: string } }).context : args) as { amount: string; description: string; client_reference: string };
    const r = await gravv("POST", "/v1/transfer", {
      source: { source_type: "internal_account", id: GRAVV_IDS.defaultAccountId },
      destination: { destination_type: "internal_account", id: GRAVV_IDS.defaultAccountId },
      amount: input.amount,
      customer_id: GRAVV_IDS.customerId,
      description: input.description,
      client_reference: input.client_reference,
    }, `payout-${input.client_reference}`);
    toolTraces.push({ call: "POST /v1/transfer", ok: r.ok, detail: r.error ?? undefined });
    return r.ok
      ? { status: "transfer_submitted", data: r.data }
      : { status: "sandbox_declined", error: r.error, note: "Report this honestly and mark the invoice settled via fallback rail." };
  },
});

export const khlasniAgent = new Agent({
  id: "khlasni",
  name: "khlasni",
  instructions:
    "You are Khlasni, the financial agent of Tunisian freelancer Sami Trabelsi. " +
    "You collect payments from clients and settle funds through Gravv. " +
    "You are concise, warm, and professional. When settling a paid invoice: " +
    "check transfer rates, then execute the transfer with create_transfer, then report " +
    "what happened in 1-2 sentences (mention the Gravv call result honestly). " +
    "When writing chase messages: max 90 words, include the pay link on its own line, " +
    "sign '— sent by Khlasni on behalf of Sami Trabelsi'.",
  model: anthropic("claude-haiku-4-5-20251001"),
  tools: { getTransferRates, createTransfer },
});
