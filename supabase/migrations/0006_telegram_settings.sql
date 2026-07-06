-- =============================================================================
-- 0006 — Store Telegram notification config in settings so it can be managed
-- (and tested) from /admin/settings without a redeploy. Env vars remain a
-- fallback. Admin-only readable via existing settings RLS. Idempotent.
-- =============================================================================
alter table public.settings
  add column if not exists telegram_bot_token text,
  add column if not exists telegram_chat_id   text;
