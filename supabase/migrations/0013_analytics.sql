-- =============================================================================
-- 0013 — Lightweight first-party page-view analytics for the admin dashboard.
-- A visit row per storefront pageview; unique visitors = distinct visitor_id
-- per day. Public logging goes through a SECURITY DEFINER RPC (anon can't insert
-- directly under RLS). Safe to run on the existing DB; idempotent.
-- =============================================================================
create table if not exists public.visits (
  id          uuid primary key default gen_random_uuid(),
  visitor_id  text not null,           -- random id kept in the browser (localStorage)
  path        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_visits_created on public.visits(created_at desc);

alter table public.visits enable row level security;

-- Admins read; the public never reads. Inserts happen only via log_visit().
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'visits' and policyname = 'visits_admin_read'
  ) then
    create policy visits_admin_read on public.visits for select using (public.is_admin());
  end if;
end;
$$;

-- Public anonymous page-view logging.
create or replace function public.log_visit(p_visitor_id text, p_path text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 then
    return; -- ignore junk
  end if;
  insert into public.visits (visitor_id, path)
  values (left(p_visitor_id, 64), left(coalesce(p_path, ''), 200));
end;
$$;

revoke all on function public.log_visit(text, text) from public;
grant execute on function public.log_visit(text, text) to anon, authenticated;
