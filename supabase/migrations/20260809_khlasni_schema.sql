-- Khlasni (Build Room hackathon 2026-08-09). Applied to Supabase hmtcfzsmuolhebsfxvyf
-- via MCP on 2026-08-09. khlasni_* prefix isolates from other products in the project.

-- Runtime store (the app reads/writes this):
create table if not exists public.khlasni_invoices (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Relational financial-record model (roadmap + module queries):
create table if not exists public.khlasni_clients (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'sami',
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.khlasni_rel_invoices (
  id text primary key,
  user_id text not null default 'sami',
  client_id uuid references public.khlasni_clients(id),
  number text,
  currency text not null default 'TND',
  amount_ht numeric,
  tva numeric default 0,
  amount_ttc numeric,
  issue_date date default current_date,
  due_date date,
  status text not null default 'draft' check (status in ('draft','sent','overdue','paid')),
  payment_link text,
  terms jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.khlasni_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'sami',
  label text not null,
  amount numeric not null,
  category text,
  date date default current_date
);

create table if not exists public.khlasni_followups (
  id uuid primary key default gen_random_uuid(),
  invoice_id text references public.khlasni_rel_invoices(id),
  level int not null default 1,
  channel text not null default 'email',
  body text,
  created_at timestamptz not null default now()
);

create unique index if not exists khlasni_followups_invoice_level_uq on public.khlasni_followups (invoice_id, level);

-- Lockdown: RLS on, zero policies -> anon/authenticated denied; service-role only.
alter table public.khlasni_invoices enable row level security;
alter table public.khlasni_clients enable row level security;
alter table public.khlasni_rel_invoices enable row level security;
alter table public.khlasni_expenses enable row level security;
alter table public.khlasni_followups enable row level security;
revoke all on public.khlasni_invoices, public.khlasni_clients, public.khlasni_rel_invoices, public.khlasni_expenses, public.khlasni_followups from anon, authenticated;
notify pgrst, 'reload schema';
