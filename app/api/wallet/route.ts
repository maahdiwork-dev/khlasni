import { NextResponse } from "next/server";
import { gravv, gravvEnabled } from "@/lib/gravv";

type GravvAccount = {
  id: string; label: string; balance: string; currency: string; status: string;
  blockchain_network: string; wallet_address: string;
  assets?: { symbol: string; balance: string }[];
};

// Live read of the real Gravv sandbox accounts — proof the wallet is an API, not a mock.
export async function GET() {
  if (!gravvEnabled()) return NextResponse.json({ accounts: [] });
  const r = await gravv<{ items: GravvAccount[] }>("GET", "/v1/accounts");
  if (!r.ok) return NextResponse.json({ accounts: [], error: r.error }, { status: 200 });
  const accounts = (r.data?.items ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    balance: a.balance,
    currency: a.currency,
    status: a.status,
    network: a.blockchain_network,
    address: a.wallet_address,
    assets: (a.assets ?? []).map((s) => ({ symbol: s.symbol, balance: s.balance })),
  }));
  return NextResponse.json({ accounts });
}
