# Ma Boutique — COD E-Commerce (Algeria)

A Cash-On-Delivery storefront + commercial back office for the Algerian market.
Built with **Next.js 16 (App Router)**, **Supabase** (Postgres, Auth, Storage),
**TypeScript**, **Tailwind v4**, and **shadcn/ui**.

- **Storefront** (`/`, `/products/[slug]`): clean landing grid + bilingual
  (Arabic + French) product pages with a COD order form — Nom, Téléphone,
  Wilaya → Commune, mode de livraison, quantité. No online payment. Quantity
  **bundle offers** ("les promos", e.g. 2 pièces = 3500 DA) apply automatically,
  and a successful order redirects to a **thank-you page** (`/commande/[token]`).
- **Admin** (`/admin/*`, Supabase-Auth protected): orders grouped by product,
  COD-aware stock, product CRUD with image upload + per-product bundle offers,
  per-wilaya delivery fees, Meta Pixel settings.

## Tech & key decisions

- **Money** is integer DZD everywhere (no floats).
- **Orders** = `orders` + `order_items` (multi-product ready). Created **only**
  via the `create_order` Postgres RPC (service role) — totals + delivery fee are
  recomputed server-side, stock is reserved atomically. The public can never read
  orders or tamper with prices.
- **Stock** is split into `stock_quantity` (physical) and `reserved_quantity`
  (held by pending orders). Reserve on order → decrement on confirm → restock on
  cancel/return. Availability shown = `stock_quantity − reserved_quantity`.
- **Geography**: 69 wilayas / 1541 communes (2025 division, from
  `kossa/algerian-cities`) seeded into the DB and bundled in
  [`lib/algeria-data.ts`](lib/algeria-data.ts) for instant dropdowns.
- **Meta**: client Pixel (`PageView`, `ViewContent`, `InitiateCheckout`, `Lead`)
  + server Conversions API (`Lead` deduped by `event_id`, `Purchase` fired on
  delivery — the real money event in COD).

## Project layout

```
app/(storefront)/         landing, product detail, not-found
app/admin/                login, orders, products, settings  (real /admin/* URLs)
actions/                  server actions (orders, products, settings, auth)
components/storefront/    ProductCard, CheckoutForm, ProductGallery, MetaPixel…
components/admin/         OrdersTable bits, ProductForm, ImageUploader, fee editor…
lib/supabase/             client.ts (anon) · server.ts (cookies) · admin.ts (service role)
lib/meta/                 pixel.ts (client) · capi.ts (server) · events.ts
lib/algeria-data.ts       bundled wilaya/commune data
supabase/migrations/      0001_init · 0002_storage · 0003_hardening · 0004_offers_and_pixel
supabase/seed_geo.sql     wilayas + communes + placeholder delivery fees
proxy.ts                  session refresh + /admin/* auth guard
```

## Setup

### 1. Create a Supabase project
At [supabase.com](https://supabase.com), create a project. From **Project
Settings → API** copy the Project URL, the anon/publishable key, and the
service_role key.

### 2. Environment
```bash
cp .env.example .env.local
```
Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...           # server-only
NEXT_PUBLIC_META_PIXEL_ID=              # optional fallback (admin Settings wins)
META_CAPI_ACCESS_TOKEN=                 # optional (Events Manager → System User token)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Apply the database
Run these in the **Supabase SQL Editor** (or via the CLI, below), in order:
1. `supabase/migrations/0001_init.sql` — tables, RLS, RPCs
2. `supabase/migrations/0002_storage.sql` — `product-images` bucket + policies
3. `supabase/migrations/0003_hardening.sql` — integrity, stale-order cleanup, category
4. `supabase/migrations/0004_offers_and_pixel.sql` — product bundle offers + public Pixel settings
5. `supabase/seed_geo.sql` — 69 wilayas, 1541 communes, placeholder fees

With the Supabase CLI instead:
```bash
supabase link --project-ref YOUR-REF
supabase db push                 # applies migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed_geo.sql
# (optional) regenerate exact types:
supabase gen types typescript --linked > types/database.types.ts
```

### 4. Create the first admin
Supabase **Authentication → Users → Add user** (email + password). A `profiles`
row is created automatically by the `on_auth_user_created` trigger, which makes
that user an admin (the `is_admin()` check powers all admin RLS). Then log in at
`/admin/login`.

### 5. Run
```bash
npm install
npm run dev      # http://localhost:3000
```

## Operating notes

- **Delivery fees** seed as placeholders (600 DA home / 350 DA stop-desk). Set
  real per-wilaya fees in **/admin/settings** — they drive the checkout total.
- **Stock flow**: a new order reserves stock (status `pending`). Confirming it
  decrements physical stock; cancelling/returning restocks. Enforced atomically
  in `update_order_status` — illegal transitions are rejected.
- **Meta**: set the Pixel ID in **/admin/settings** (the storefront reads it via
  the public `get_storefront_settings` RPC) — `NEXT_PUBLIC_META_PIXEL_ID` is only
  a fallback. Add `META_CAPI_ACCESS_TOKEN` for server-side CAPI. Validate with
  Events Manager → Test Events (`META_TEST_EVENT_CODE`).
- **Bundle offers**: set per-product promos ("N pièces = X DA") in the product
  editor. The matching tier is applied automatically at checkout and recomputed
  server-side in `create_order` (never trust the client total).
- The public order endpoint is rate-limited best-effort per IP
  ([`lib/rate-limit.ts`](lib/rate-limit.ts)); for multi-instance hosting back it
  with Redis/Upstash.

## Verification checklist

- Storefront landing shows only active products; product page renders AR+FR.
- Checkout: Wilaya→Commune cascade works; total = subtotal + correct fee; submit
  creates `orders`/`order_items` and bumps `reserved_quantity`.
- Ordering more than available is blocked; confirm/cancel/return move stock
  correctly (inspect `products` + `stock_movements`).
- Unauthenticated `/admin/*` redirects to `/admin/login`; after login, orders are
  grouped by product and status transitions work; product CRUD + image upload
  persist; fee edits reflect at checkout.
- Anon key cannot read `orders` or write `products` (RLS); a tampered total has
  no effect (server recomputes).
