-- =============================================================================
-- Storage: public product image bucket. Public read, admin-only writes.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can read product images (bucket is public, but be explicit for clarity)
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only provisioned admins can upload / modify / delete
create policy "product_images_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
