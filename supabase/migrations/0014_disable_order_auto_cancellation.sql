-- Pending COD orders remain pending until an operator changes their status.
-- Keep the legacy RPC as a no-op so callers using its old signature are safe.
begin;

create or replace function public.cleanup_stale_orders(
  p_max_age interval default interval '2 hours'
)
returns integer
language sql
set search_path = public
as $$
  select 0;
$$;

comment on function public.cleanup_stale_orders(interval) is
  'Deprecated: automatic cancellation is disabled. Always returns zero without changing orders or stock.';

-- pg_cron may be absent in local/test databases. Disable every job invoking
-- the legacy RPC, including renamed jobs, without touching unrelated jobs.
do $$
declare
  scheduled_job record;
begin
  if to_regclass('cron.job') is not null then
    for scheduled_job in
      select jobid from cron.job
      where jobname = 'cleanup-stale-orders'
         or command ilike '%cleanup_stale_orders%'
    loop
      perform cron.unschedule(scheduled_job.jobid);
    end loop;
  end if;
end;
$$;

commit;
