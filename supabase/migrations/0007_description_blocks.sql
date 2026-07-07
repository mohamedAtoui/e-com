-- =============================================================================
-- 0007 — Rich product description ("A+ content", Amazon-style): an ordered list
-- of content blocks (heading / paragraph / image), bilingual for text. Stored
-- as jsonb on the product. Safe to run on the existing DB; idempotent.
-- =============================================================================
alter table public.products
  add column if not exists description_blocks jsonb not null default '[]'::jsonb;
