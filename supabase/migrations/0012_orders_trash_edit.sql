-- =============================================================================
-- 0012 — Order trash (soft delete + restore) and admin order editing
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Soft delete. A trashed order is hidden everywhere and counts for nothing,
--    but the row (and its items) survive so a mistake can be undone.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists deleted_at timestamptz;

create index if not exists idx_orders_active
  on public.orders (created_at desc)
  where deleted_at is null;

-- Applies (p_sign = +1) or undoes (p_sign = -1) a stock effect for every line
-- of an order. Used by trash/restore so a trashed order never holds inventory.
create or replace function public._order_stock(
  p_order_id uuid,
  p_effect   text,
  p_sign     integer
) returns void
language plpgsql security definer set search_path = public as $$
declare v_item record;
begin
  if p_effect not in ('reserved','sold') then return; end if;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id
  loop
    if p_effect = 'reserved' then
      update public.products
         set reserved_quantity = greatest(reserved_quantity + (p_sign * v_item.quantity), 0)
       where id = v_item.product_id;
    else -- 'sold' consumes physical stock, so the signs are inverted
      update public.products
         set stock_quantity = greatest(stock_quantity - (p_sign * v_item.quantity), 0)
       where id = v_item.product_id;
    end if;
  end loop;
end;
$$;
revoke all on function public._order_stock(uuid,text,integer) from public;

-- Move an order to the trash: release whatever stock it was holding.
create or replace function public.trash_order(p_order_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_status text; v_deleted timestamptz; v_eff text;
begin
  if not public.has_page('orders') then raise exception 'not_authorized'; end if;

  select status, deleted_at into v_status, v_deleted
    from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_deleted is not null then return; end if;

  select stock_effect into v_eff from public.order_statuses where key = v_status;
  perform public._order_stock(p_order_id, v_eff, -1);

  update public.orders set deleted_at = now() where id = p_order_id;
end;
$$;
revoke all on function public.trash_order(uuid) from public;
grant execute on function public.trash_order(uuid) to authenticated;

-- Bring it back: re-apply the stock effect of its current status.
create or replace function public.restore_order(p_order_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_status text; v_deleted timestamptz; v_eff text;
begin
  if not public.has_page('orders') then raise exception 'not_authorized'; end if;

  select status, deleted_at into v_status, v_deleted
    from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_deleted is null then return; end if;

  select stock_effect into v_eff from public.order_statuses where key = v_status;
  perform public._order_stock(p_order_id, v_eff, 1);

  update public.orders set deleted_at = null where id = p_order_id;
end;
$$;
revoke all on function public.restore_order(uuid) from public;
grant execute on function public.restore_order(uuid) to authenticated;

-- Permanent removal. Only ever allowed from the trash, so it can't be reached
-- by a single misclick on the orders list.
create or replace function public.purge_order(p_order_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_deleted timestamptz;
begin
  if not public.has_page('orders') then raise exception 'not_authorized'; end if;

  select deleted_at into v_deleted from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_deleted is null then raise exception 'order_not_trashed'; end if;

  update public.checkout_leads set order_id = null where order_id = p_order_id;
  delete from public.stock_movements where order_id = p_order_id;
  delete from public.orders where id = p_order_id; -- order_items cascade
end;
$$;
revoke all on function public.purge_order(uuid) from public;
grant execute on function public.purge_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Editing an order. Customers get their phone, name or commune wrong all the
--    time; the admin fixes it here. Changing the wilaya/method recomputes the
--    delivery fee, and changing the quantity re-runs the bundle-offer pricing
--    and moves stock — exactly like create_order would have.
-- ---------------------------------------------------------------------------
create or replace function public.update_order_details(
  p_order_id        uuid,
  p_customer_name   text,
  p_customer_phone  text,
  p_wilaya_code     smallint,
  p_commune_id      integer,
  p_address         text,
  p_delivery_method text,
  p_notes           text,
  p_quantity        integer default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order       public.orders%rowtype;
  v_eff         text;
  v_fee_row     public.delivery_fees%rowtype;
  v_delivery    integer;
  v_item        record;
  v_product     public.products%rowtype;
  v_offer_price integer;
  v_offer_free  boolean;
  v_free_ship   boolean := false;
  v_unit_price  integer;
  v_subtotal    integer := 0;
  v_delta       integer;
begin
  if not public.has_page('orders') then raise exception 'not_authorized'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.deleted_at is not null then raise exception 'order_in_trash'; end if;

  if p_delivery_method not in ('home','stopdesk') then
    raise exception 'invalid_delivery_method';
  end if;
  if coalesce(trim(p_customer_name), '') = '' then raise exception 'name_required'; end if;
  if coalesce(trim(p_customer_phone), '') = '' then raise exception 'phone_required'; end if;
  if not exists (select 1 from public.communes where id = p_commune_id and wilaya_code = p_wilaya_code) then
    raise exception 'invalid_commune_for_wilaya';
  end if;

  select stock_effect into v_eff from public.order_statuses where key = v_order.status;

  -- ---- optional quantity change (single-line orders only) ----------------
  if p_quantity is not null then
    if p_quantity <= 0 then raise exception 'invalid_quantity'; end if;
    if (select count(*) from public.order_items where order_id = p_order_id) <> 1 then
      raise exception 'multi_item_order';
    end if;

    select * into v_item from public.order_items where order_id = p_order_id;
    v_delta := p_quantity - v_item.quantity;

    if v_delta <> 0 then
      select * into v_product from public.products where id = v_item.product_id for update;
      if not found then raise exception 'product_unavailable'; end if;

      -- growing the line must still fit in what is physically available
      if v_delta > 0 and v_eff in ('reserved','sold')
         and (v_product.stock_quantity - v_product.reserved_quantity) < v_delta then
        raise exception 'insufficient_stock';
      end if;

      if v_eff = 'reserved' then
        update public.products
           set reserved_quantity = greatest(reserved_quantity + v_delta, 0)
         where id = v_product.id;
      elsif v_eff = 'sold' then
        update public.products
           set stock_quantity = greatest(stock_quantity - v_delta, 0)
         where id = v_product.id;
      end if;

      insert into public.stock_movements (product_id, order_id, delta, type, created_by)
      values (v_product.id, p_order_id, v_delta, 'manual', auth.uid());
    else
      select * into v_product from public.products where id = v_item.product_id;
    end if;

    -- re-price the line through the bundle offers, same rule as create_order
    select (elem->>'price')::int, coalesce((elem->>'free_delivery')::boolean, false)
      into v_offer_price, v_offer_free
      from jsonb_array_elements(coalesce(v_product.offers, '[]'::jsonb)) elem
     where (elem->>'qty')::int = p_quantity
     limit 1;

    if v_offer_price is not null then
      v_unit_price := round(v_offer_price::numeric / p_quantity);
      v_free_ship  := v_offer_free;
    else
      v_unit_price := v_product.price;
    end if;

    update public.order_items
       set quantity = p_quantity, unit_price = v_unit_price
     where id = v_item.id;
  else
    -- no quantity change: does the order still sit on a free-delivery offer?
    select true into v_free_ship
      from public.order_items i
      join public.products pr on pr.id = i.product_id
      cross join lateral jsonb_array_elements(coalesce(pr.offers, '[]'::jsonb)) elem
     where i.order_id = p_order_id
       and (elem->>'qty')::int = i.quantity
       and coalesce((elem->>'free_delivery')::boolean, false)
     limit 1;
    v_free_ship := coalesce(v_free_ship, false);
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_subtotal
    from public.order_items where order_id = p_order_id;

  -- ---- delivery fee for the (possibly new) destination -------------------
  select * into v_fee_row from public.delivery_fees where wilaya_code = p_wilaya_code;
  if not found then raise exception 'no_delivery_to_wilaya'; end if;
  if p_delivery_method = 'home' then
    if not v_fee_row.home_available then raise exception 'home_delivery_unavailable'; end if;
    v_delivery := v_fee_row.home_fee;
  else
    if not v_fee_row.stopdesk_available then raise exception 'stopdesk_unavailable'; end if;
    v_delivery := v_fee_row.stopdesk_fee;
  end if;
  if v_free_ship then v_delivery := 0; end if;

  update public.orders
     set customer_name   = trim(p_customer_name),
         customer_phone  = trim(p_customer_phone),
         wilaya_code     = p_wilaya_code,
         commune_id      = p_commune_id,
         address         = nullif(trim(coalesce(p_address, '')), ''),
         delivery_method = p_delivery_method,
         notes           = nullif(trim(coalesce(p_notes, '')), ''),
         delivery_fee    = v_delivery,
         subtotal        = v_subtotal,
         total           = v_subtotal + v_delivery
   where id = p_order_id;
end;
$$;
revoke all on function public.update_order_details(uuid,text,text,smallint,integer,text,text,text,integer) from public;
grant execute on function public.update_order_details(uuid,text,text,smallint,integer,text,text,text,integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. A trashed order is frozen: its stock is already released, so letting the
--    status change would double-apply the effect on restore.
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
  v_deleted  timestamptz;
  v_item     record;
begin
  if not public.has_page('orders') then
    raise exception 'not_authorized';
  end if;

  select stock_effect into v_new_eff from public.order_statuses where key = p_status;
  if not found then raise exception 'invalid_status'; end if;

  select status, deleted_at into v_old, v_deleted from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_deleted is not null then raise exception 'order_in_trash'; end if;
  if v_old = p_status then return; end if;
  select stock_effect into v_old_eff from public.order_statuses where key = v_old;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id
  loop
    if v_old_eff = 'reserved' then
      update public.products set reserved_quantity = greatest(reserved_quantity - v_item.quantity, 0) where id = v_item.product_id;
    elsif v_old_eff = 'sold' then
      update public.products set stock_quantity = stock_quantity + v_item.quantity where id = v_item.product_id;
    end if;
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
-- 4. The public thank-you page must not resurrect a trashed order.
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
        'product_id', i.product_id,
        'name_fr', i.product_name_fr,
        'name_ar', i.product_name_ar,
        'quantity', i.quantity,
        'unit_price', i.unit_price))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.meta_event_id = p_event_id
    and o.deleted_at is null;
$$;
