import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Known clients for the invoice form autocomplete — Khlasni remembers who you work with.
export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ clients: [] });
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("khlasni_clients")
    .select("name, email")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ clients: [] });
  return NextResponse.json({ clients: data ?? [] });
}
