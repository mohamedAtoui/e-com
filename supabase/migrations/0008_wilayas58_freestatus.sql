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
