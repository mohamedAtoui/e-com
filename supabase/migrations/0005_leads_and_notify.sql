-- =============================================================================
-- 0005 — Abandoned/incomplete checkouts ("paniers abandonnés") + realtime for
-- new-order notifications. Safe to run on the existing DB; idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. checkout_leads: a partial checkout captured progressively as the visitor
--    fills the form. `id` is generated client-side (kept in localStorage) so
--    every debounced save upserts the SAME row. Converted → linked to an order.
-- ---------------------------------------------------------------------------
create table if not exists public.checkout_leads (
  id              uuid primary key,
  product_id      uuid references public.products(id) on delete set null,
  customer_name   text,
  customer_phone  text,
  wilaya_code     smallint,
  commune_id      integer,
  delivery_method text,
  quantity        integer,
  status          text not null default 'active'
                    check (status in ('active','converted','dismissed')),
  order_id        uuid references public.orders(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_checkout_leads_status
  on public.checkout_leads(status, updated_at desc);

alter table public.checkout_leads enable row level security;

-- Admin-only access. Public writes go through the service-role server action
-- (actions/leads.ts) — never a direct anon insert — mirroring orders.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'checkout_leads'
      and policyname = 'checkout_leads_admin_all'
  ) then
    create policy checkout_leads_admin_all on public.checkout_leads
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end;
$$;

drop trigger if exists trg_checkout_leads_updated on public.checkout_leads;
create trigger trg_checkout_leads_updated
  before update on public.checkout_leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Realtime: broadcast INSERTs on orders so an open admin dashboard is
--    notified instantly (RLS still applies — only admins receive the rows).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public' and tablename = 'orders'
     )
  then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
