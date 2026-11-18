-- Run manually after enabling Supabase Cron and applying ALL notification migrations.
-- Named jobs can be rescheduled by running this file again without duplicating them.
SELECT cron.schedule('techarena-notification-events','10 seconds',
  $$SELECT public.process_notification_events(100);$$);
SELECT cron.schedule('techarena-notification-log-cleanup','0 4 * * *',
  $$DELETE FROM cron.job_run_details
    WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('techarena-notification-events','techarena-notification-log-cleanup'))
      AND end_time < now()-interval '7 days';$$);
