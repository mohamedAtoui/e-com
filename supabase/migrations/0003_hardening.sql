-- =============================================================================
-- 0003 — Hardening, data integrity, and features
-- Safe to run on the existing DB. Idempotent where practical.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1a. Lock down admin access: stop auto-granting a profile (=admin) on signup.
--     Admins are now provisioned MANUALLY (insert into profiles ... role 'admin').
--     Existing admin profiles are untouched and keep working.
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2a. Auto-cancel stale pending orders (release held stock). Runs as definer,
--     so it does its own stock release (cannot call the is_admin-guarded RPC).
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_stale_orders(p_max_age interval default interval '2 hours')
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_order  record;
  v_item   record;
  v_count  integer := 0;
begin
  for v_order in
    select id from public.orders
    where status = 'pending' and created_at < now() - p_max_age
    for update skip locked
  loop
    for v_item in select product_id, quantity from public.order_items where order_id = v_order.id
    loop
      update public.products
         set reserved_quantity = greatest(reserved_quantity - v_item.quantity, 0)
       where id = v_item.product_id;
      insert into public.stock_movements (product_id, order_id, delta, type)
      values (v_item.product_id, v_order.id, v_item.quantity, 'release');
    end loop;
    update public.orders set status = 'cancelled' where id = v_order.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Schedule every 15 min via pg_cron (enable the extension first).
create extension if not exists pg_cron;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-stale-orders') then
    perform cron.unschedule('cleanup-stale-orders');
  end if;
  perform cron.schedule('cleanup-stale-orders', '*/15 * * * *',
    $cron$ select public.cleanup_stale_orders(); $cron$);
end;
$$;

-- ---------------------------------------------------------------------------
-- 2c. Ensure every wilaya has a delivery_fees row (backfill with safe default).
-- ---------------------------------------------------------------------------
insert into public.delivery_fees (wilaya_code, home_fee, stopdesk_fee)
select code, 600, 350 from public.wilayas
on conflict (wilaya_code) do nothing;

-- ---------------------------------------------------------------------------
-- 4a. Product category (for storefront filters).
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists category text not null default 'autre';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_category_check'
  ) then
    alter table public.products add constraint products_category_check
      check (category in ('lampe','suspension','applique','lanterne','autre'));
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4b. Public order-confirmation lookup by the unguessable meta_event_id token.
-- ---------------------------------------------------------------------------
create or replace function public.get_order_summary(p_event_id uuid)
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'delivery_method', o.delivery_method,
    'wilaya_code', o.wilaya_code,
    'commune_id', o.commune_id,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name_fr', i.product_name_fr,
        'name_ar', i.product_name_ar,
        'quantity', i.quantity,
        'unit_price', i.unit_price))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.meta_event_id = p_event_id;
$$;

revoke all on function public.get_order_summary(uuid) from public;
grant execute on function public.get_order_summary(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Brand consistency: default + existing settings row → "Lighty".
-- ---------------------------------------------------------------------------
alter table public.settings alter column store_name set default 'Lighty';
update public.settings set store_name = 'Lighty' where store_name = 'Ma Boutique';
