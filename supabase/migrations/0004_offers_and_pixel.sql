-- =============================================================================
-- 0004 — Quantity bundle offers ("les promos") + public storefront settings.
-- Safe to run on the existing DB. Idempotent where practical.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Product bundle offers: jsonb array of { "qty": int, "price": int } where
--    price is the TOTAL DZD for that quantity. e.g. [{"qty":2,"price":3500}].
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists offers jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 2. create_order — now applies an exact-quantity bundle offer when one matches.
--    Mirrors lib/offers.ts computeLine(): unit = round(offer.price / qty),
--    line subtotal = unit * qty (kept consistent so every total reconciles).
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_customer_name   text,
  p_customer_phone  text,
  p_wilaya_code     smallint,
  p_commune_id      integer,
  p_address         text,
  p_delivery_method text,
  p_items           jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_fee_row     public.delivery_fees%rowtype;
  v_item        jsonb;
  v_product     public.products%rowtype;
  v_qty         integer;
  v_unit_price  integer;
  v_offer_price integer;
  v_subtotal    integer := 0;
  v_delivery    integer;
  v_order_id    uuid;
  v_order_num   bigint;
  v_event_id    uuid := gen_random_uuid();
  v_reserved_id uuid;
begin
  if p_delivery_method not in ('home','stopdesk') then
    raise exception 'invalid_delivery_method';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_order';
  end if;

  -- commune must belong to the chosen wilaya
  if not exists (select 1 from public.communes where id = p_commune_id and wilaya_code = p_wilaya_code) then
    raise exception 'invalid_commune_for_wilaya';
  end if;

  -- delivery fee + availability for the chosen method
  select * into v_fee_row from public.delivery_fees where wilaya_code = p_wilaya_code;
  if not found then
    raise exception 'no_delivery_to_wilaya';
  end if;
  if p_delivery_method = 'home' then
    if not v_fee_row.home_available then raise exception 'home_delivery_unavailable'; end if;
    v_delivery := v_fee_row.home_fee;
  else
    if not v_fee_row.stopdesk_available then raise exception 'stopdesk_unavailable'; end if;
    v_delivery := v_fee_row.stopdesk_fee;
  end if;

  -- create the order shell first (so order_items + movements can reference it)
  insert into public.orders (customer_name, customer_phone, wilaya_code, commune_id,
                             address, delivery_method, delivery_fee, subtotal, total,
                             status, meta_event_id)
  values (p_customer_name, p_customer_phone, p_wilaya_code, p_commune_id,
          p_address, p_delivery_method, v_delivery, 0, v_delivery, 'pending', v_event_id)
  returning id, order_number into v_order_id, v_order_num;

  -- process each line: validate, reserve atomically, snapshot price
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 then raise exception 'invalid_quantity'; end if;

    -- atomic conditional reserve: only succeeds if enough is available
    update public.products
       set reserved_quantity = reserved_quantity + v_qty
     where id = (v_item->>'product_id')::uuid
       and is_active = true
       and (stock_quantity - reserved_quantity) >= v_qty
    returning id into v_reserved_id;

    if v_reserved_id is null then
      -- distinguishes "out of stock" from "no such active product"
      if not exists (select 1 from public.products where id = (v_item->>'product_id')::uuid and is_active) then
        raise exception 'product_unavailable';
      end if;
      raise exception 'insufficient_stock';
    end if;

    select * into v_product from public.products where id = v_reserved_id;

    -- apply an exact-quantity bundle offer if the product defines one
    select (elem->>'price')::int into v_offer_price
      from jsonb_array_elements(coalesce(v_product.offers, '[]'::jsonb)) elem
     where (elem->>'qty')::int = v_qty
     limit 1;

    if v_offer_price is not null then
      v_unit_price := round(v_offer_price::numeric / v_qty);
    else
      v_unit_price := v_product.price;
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_qty);

    insert into public.order_items (order_id, product_id, quantity, unit_price,
                                    product_name_fr, product_name_ar)
    values (v_order_id, v_product.id, v_qty, v_unit_price,
            v_product.name_fr, v_product.name_ar);

    insert into public.stock_movements (product_id, order_id, delta, type)
    values (v_product.id, v_order_id, v_qty, 'reserve');

    v_offer_price := null; -- reset for the next line
  end loop;

  -- finalize totals
  update public.orders
     set subtotal = v_subtotal, total = v_subtotal + v_delivery
   where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_num,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery,
    'total', v_subtotal + v_delivery,
    'meta_event_id', v_event_id
  );
end;
$$;

revoke all on function public.create_order(text,text,smallint,integer,text,text,jsonb) from public;
grant execute on function public.create_order(text,text,smallint,integer,text,text,jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Public storefront settings — exposes ONLY the Meta Pixel id + store name
--    to anonymous visitors (the settings table itself stays admin-read-only via
--    RLS). This is what makes the admin-configured Pixel actually load on the
--    storefront. SECURITY DEFINER bypasses the settings_admin_read policy.
-- ---------------------------------------------------------------------------
create or replace function public.get_storefront_settings()
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'store_name', s.store_name,
    'meta_pixel_id', s.meta_pixel_id
  )
  from public.settings s
  where s.id = true;
$$;

revoke all on function public.get_storefront_settings() from public;
grant execute on function public.get_storefront_settings() to anon, authenticated;
