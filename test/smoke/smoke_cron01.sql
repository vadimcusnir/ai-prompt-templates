-- Test CRON-01: cron fără wrapper
-- Acest fișier ar trebui să genereze violări CRON-01

-- Violare 1: cron.schedule cu funcție directă
SELECT cron.schedule('test-refresh', '0 0 * * *', 'SELECT refresh_tier_access_pool_all()');

-- Violare 2: cron.schedule cu funcție de business
SELECT cron.schedule('check-cap', '*/15 * * * *', 'SELECT check_library_cap_and_alert()');

-- Violare 3: cron.schedule cu funcție de audit
SELECT cron.schedule('preview-audit', '0 2 * * *', 'SELECT check_preview_privileges_and_alert()');

-- Violare 4: cron.schedule cu funcție de bundle
SELECT cron.schedule('bundle-check', '0 4 * * *', 'SELECT check_bundle_consistency_and_alert()');

-- Violare 5: cron.schedule fără wrapper permis
SELECT cron.schedule('custom-job', '0 6 * * *', 'SELECT custom_function()');
