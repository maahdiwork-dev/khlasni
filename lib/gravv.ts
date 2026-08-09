// Gravv API client — the ONLY file that talks to Gravv. Key stays server-side.
const BASE = "https://api.gravv.xyz";
const KEY = process.env.GRAVV_API_KEY ?? "";

// Sandbox entities provisioned before the demo (see scripts/setup-sandbox notes)
export const GRAVV_IDS = {
  customerId: process.env.GRAVV_CUSTOMER_ID ?? "def7922c-31e0-4ec0-a1bf-84cfcf4d48b8", // Sami Trabelsi (TN)
  defaultAccountId: process.env.GRAVV_ACCOUNT_ID ?? "93b2ba59-d567-4bca-a118-83ffc89ba00a",
  walletAddress: process.env.GRAVV_WALLET_ADDRESS ?? "0x68b78e21B9F5bFa5c84B68332D27e3031DE3Fc71",
};

export async function gravv<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  idempotencyKey?: string,
  timeoutMs = 8000,
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Api-Key": KEY,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await res.json().catch(() => ({ data: null, error: `non-JSON ${res.status}` }))) as {
      data: T | null;
      error: string | null;
    };
    return { ok: res.ok && !json.error, status: res.status, data: json.data, error: json.error };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : "network error" };
  }
}

export const gravvEnabled = () => KEY.startsWith("grvSec_sandbox_");
