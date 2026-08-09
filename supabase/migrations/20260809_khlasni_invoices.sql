-- Khlasni hackathon store (2026-08-09, The Build Room). Isolated table, service-role only.
create table if not exists public.khlasni_invoices (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.khlasni_invoices enable row level security;
-- No policies: anon/authenticated fully blocked; server uses service_role (bypasses RLS).
revoke all on public.khlasni_invoices from anon, authenticated;
