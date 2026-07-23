-- Gaba Hardware online schema
-- Run this in Supabase SQL Editor after creating a project.

create extension if not exists "pgcrypto";

create table if not exists public.store_settings (
  id text primary key default 'main',
  store_name text not null default 'Gaba Hardware',
  address text not null default 'Philippines',
  phone text not null default '',
  receipt_footer text not null default 'Salamat! Thank you for your purchase.',
  updated_at timestamptz not null default now()
);

create table if not exists public.store_users (
  id text primary key,
  name text not null,
  username text not null unique,
  role text not null check (role in ('admin', 'staff')),
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  sku text not null,
  category text not null,
  price numeric not null default 0,
  cost numeric not null default 0,
  stock integer not null default 0,
  reorder_at integer not null default 0,
  unit text not null default 'ea',
  image text,
  favorite boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id text primary key,
  created_at timestamptz not null default now(),
  total numeric not null default 0,
  payment_method text not null,
  customer_name text,
  customer_phone text,
  note text,
  reference_no text,
  voided boolean not null default false,
  voided_at timestamptz,
  sold_by_id text,
  sold_by_name text,
  items jsonb not null default '[]'::jsonb
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id text,
  actor_name text,
  action text not null,
  detail text
);

alter table public.store_settings enable row level security;
alter table public.store_users enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.activity_log enable row level security;

-- Simple store app policies: authenticated anon key access for one-store use.
-- For stronger security later, switch to Supabase Auth users + stricter RLS.
create policy "store_settings_all" on public.store_settings for all using (true) with check (true);
create policy "store_users_all" on public.store_users for all using (true) with check (true);
create policy "products_all" on public.products for all using (true) with check (true);
create policy "customers_all" on public.customers for all using (true) with check (true);
create policy "sales_all" on public.sales for all using (true) with check (true);
create policy "activity_log_all" on public.activity_log for all using (true) with check (true);

insert into public.store_settings (id) values ('main') on conflict (id) do nothing;
