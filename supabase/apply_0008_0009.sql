-- Run once in Supabase SQL Editor. Applies 0008 then 0009.

-- ===== 0008 =====
-- =============================================================================
-- 0004 — Trim delivery to the 58 official wilayas + free order-status editing
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Delivery: keep only the 58 standard wilayas (codes 59-69 had no communes).
--    Guarded so we never delete a wilaya an order actually used.
-- ---------------------------------------------------------------------------
delete from public.delivery_fees where wilaya_code > 58;
delete from public.communes
  where wilaya_code > 58
    and id not in (select commune_id from public.orders);
delete from public.wilayas
  where code > 58
    and code not in (select wilaya_code from public.orders);

-- ---------------------------------------------------------------------------
-- 2. update_order_status — admin may set ANY status (confirm / cancel / edit
--    freely). Stock is reconciled by category so it always stays correct:
--      pending                       -> holds qty in reserved_quantity
--      confirmed/shipped/delivered   -> qty removed from physical stock
--      cancelled/returned            -> nothing held (stock as if not sold)
--    On each change we undo the old effect then apply the new one.
-- ---------------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status   text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old    text;
  v_admin  uuid := auth.uid();
  v_item   record;
  v_delta  integer;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;
  if p_status not in ('pending','confirmed','shipped','delivered','cancelled','returned') then
    raise exception 'invalid_status';
  end if;

  select status into v_old from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_old = p_status then return; end if;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id
  loop
    -- undo the old status' stock effect
    if v_old = 'pending' then
      update public.products
         set reserved_quantity = greatest(reserved_quantity - v_item.quantity, 0)
       where id = v_item.product_id;
    elsif v_old in ('confirmed','shipped','delivered') then
      update public.products
         set stock_quantity = stock_quantity + v_item.quantity
       where id = v_item.product_id;
    end if;

    -- apply the new status' stock effect
    if p_status = 'pending' then
      update public.products
         set reserved_quantity = reserved_quantity + v_item.quantity
       where id = v_item.product_id;
    elsif p_status in ('confirmed','shipped','delivered') then
      update public.products
         set stock_quantity = greatest(stock_quantity - v_item.quantity, 0)
       where id = v_item.product_id;
    end if;

    -- audit the net physical-stock change, if any
    v_delta :=
      (case when v_old in ('confirmed','shipped','delivered') then v_item.quantity else 0 end)
      - (case when p_status in ('confirmed','shipped','delivered') then v_item.quantity else 0 end);
    if v_delta <> 0 then
      insert into public.stock_movements (product_id, order_id, delta, type, created_by)
      values (v_item.product_id, p_order_id, v_delta,
              case when v_delta > 0 then 'restock' else 'decrement' end, v_admin);
    end if;
  end loop;

  update public.orders
     set status = p_status,
         confirmed_at = case when p_status = 'confirmed' and confirmed_at is null then now() else confirmed_at end
   where id = p_order_id;
end;
$$;

-- ===== 0009 =====
-- =============================================================================
-- 0009 — Custom order statuses (with per-status stock rules) + roles & page RBAC
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Order statuses (editable). stock_effect drives inventory:
--    'reserved' = holds qty in reserved_quantity (like pending)
--    'sold'     = removes qty from physical stock (like confirmed/shipped/delivered)
--    'none'     = no hold (like cancelled/returned)
-- ---------------------------------------------------------------------------
create table if not exists public.order_statuses (
  key          text primary key,
  label_fr     text not null,
  label_ar     text not null,
  stock_effect text not null default 'none' check (stock_effect in ('reserved','sold','none')),
  color        text not null default '#8a8a8a',
  sort_order   integer not null default 100,
  is_system    boolean not null default false
);

insert into public.order_statuses (key,label_fr,label_ar,stock_effect,color,sort_order,is_system) values
  ('pending',  'En attente','قيد الانتظار','reserved','#b98900',10,true),
  ('confirmed','Confirmée', 'مؤكدة',       'sold',    '#2f7d32',20,true),
  ('shipped',  'Expédiée',  'تم الشحن',    'sold',    '#1f6feb',30,true),
  ('delivered','Livrée',    'تم التسليم',  'sold',    '#15803d',40,true),
  ('cancelled','Annulée',   'ملغاة',       'none',    '#b4513f',50,true),
  ('returned', 'Retournée', 'مرتجعة',      'none',    '#9a3412',60,true)
on conflict (key) do nothing;

-- Replace the hard-coded CHECK on orders.status with an FK to the table.
alter table public.orders drop constraint if exists orders_status_check;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_status_fkey') then
    alter table public.orders
      add constraint orders_status_fkey foreign key (status)
      references public.order_statuses(key) on update cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Roles + page permissions. `pages` lists the admin sections the role sees.
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  pages      text[] not null default '{}',
  is_system  boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.roles (name, pages, is_system) values
  ('Administrateur', array['orders','leads','products','settings','statuses','roles','users'], true)
on conflict (name) do nothing;

alter table public.profiles add column if not exists role_id uuid references public.roles(id);
update public.profiles
   set role_id = (select id from public.roles where name = 'Administrateur')
 where role_id is null;

-- Page-permission helpers (SECURITY DEFINER to avoid RLS recursion).
create or replace function public.my_pages()
returns text[] language sql security definer stable set search_path = public as $$
  select coalesce(
    (select r.pages from public.profiles p join public.roles r on r.id = p.role_id
      where p.id = auth.uid()),
    '{}');
$$;
revoke all on function public.my_pages() from public;
grant execute on function public.my_pages() to authenticated;

create or replace function public.has_page(p text)
returns boolean language sql security definer stable set search_path = public as $$
  select public.is_admin() and p = any(public.my_pages());
$$;
revoke all on function public.has_page(text) from public;
grant execute on function public.has_page(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Data-driven update_order_status (any status; stock via stock_effect).
-- ---------------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status   text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old      text;
  v_old_eff  text;
  v_new_eff  text;
  v_admin    uuid := auth.uid();
  v_item     record;
begin
  if not public.has_page('orders') then
    raise exception 'not_authorized';
  end if;

  select stock_effect into v_new_eff from public.order_statuses where key = p_status;
  if not found then raise exception 'invalid_status'; end if;

  select status into v_old from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_old = p_status then return; end if;
  select stock_effect into v_old_eff from public.order_statuses where key = v_old;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id
  loop
    -- undo old effect
    if v_old_eff = 'reserved' then
      update public.products set reserved_quantity = greatest(reserved_quantity - v_item.quantity, 0) where id = v_item.product_id;
    elsif v_old_eff = 'sold' then
      update public.products set stock_quantity = stock_quantity + v_item.quantity where id = v_item.product_id;
    end if;
    -- apply new effect
    if v_new_eff = 'reserved' then
      update public.products set reserved_quantity = reserved_quantity + v_item.quantity where id = v_item.product_id;
    elsif v_new_eff = 'sold' then
      update public.products set stock_quantity = greatest(stock_quantity - v_item.quantity, 0) where id = v_item.product_id;
    end if;
    insert into public.stock_movements (product_id, order_id, delta, type, created_by)
    values (v_item.product_id, p_order_id, 0, 'manual', v_admin);
  end loop;

  update public.orders
     set status = p_status,
         confirmed_at = case when p_status = 'confirmed' and confirmed_at is null then now() else confirmed_at end
   where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table public.order_statuses enable row level security;
create policy order_statuses_public_read on public.order_statuses for select using (true);
create policy order_statuses_manage on public.order_statuses for all
  using (public.has_page('statuses')) with check (public.has_page('statuses'));

alter table public.roles enable row level security;
create policy roles_admin_read on public.roles for select using (public.is_admin());
create policy roles_manage on public.roles for all
  using (public.has_page('roles')) with check (public.has_page('roles'));
