-- =============================================================================
-- 0011 — Admin-managed product reviews (social proof on the product page).
-- Reviews are authored by the shop owner in admin, not submitted by visitors,
-- so there is no public INSERT path — only public read of published rows.
-- =============================================================================

create table if not exists public.product_reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  author_name text not null,
  rating      smallint not null default 5 check (rating between 1 and 5),
  comment_fr  text,
  comment_ar  text,
  image_path  text,
  is_published boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_product_reviews_product
  on public.product_reviews(product_id, is_published);

alter table public.product_reviews enable row level security;

-- Public storefront: only published reviews.
create policy product_reviews_public_read on public.product_reviews
  for select using (is_published = true);

-- Admins with the products page may read everything and manage.
create policy product_reviews_admin_read on public.product_reviews
  for select using (public.has_page('products'));
create policy product_reviews_admin_write on public.product_reviews
  for all using (public.has_page('products')) with check (public.has_page('products'));

-- ---------------------------------------------------------------------------
-- get_order_summary: expose product_id per line so the thank-you page can send
-- a properly attributed Meta "Lead" event (content_ids were empty before).
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
  where o.meta_event_id = p_event_id;
$$;

revoke all on function public.get_order_summary(uuid) from public;
grant execute on function public.get_order_summary(uuid) to anon, authenticated;
