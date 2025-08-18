-- Test DB-01: SELECT pe tabel brut
-- Acest fișier ar trebui să genereze violări DB-01

-- Violare 1: SELECT direct pe neurons
SELECT * FROM public.neurons WHERE published = true;

-- Violare 2: SELECT cu JOIN pe tabele brute
SELECT n.*, b.* FROM public.neurons n 
JOIN public.bundles b ON n.bundle_id = b.id;

-- Violare 3: SELECT cu subquery pe tabel brut
SELECT * FROM (
  SELECT * FROM public.user_subscriptions 
  WHERE user_id = 1
) sub;

-- Violare 4: SELECT cu alias pe neuron_assets
SELECT na.* FROM neuron_assets na 
WHERE na.neuron_id = 1;

-- Violare 5: SELECT complex cu multiple tabele brute
SELECT 
  p.name as plan_name,
  u.email as user_email,
  n.title as neuron_title
FROM public.plans p
JOIN public.user_subscriptions u ON p.id = u.plan_id
JOIN public.neurons n ON n.bundle_id = u.bundle_id;
