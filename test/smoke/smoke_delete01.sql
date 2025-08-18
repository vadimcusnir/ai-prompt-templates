-- Test DELETE-01: DELETE pe neurons
-- Acest fișier ar trebui să genereze violări DELETE-01

-- Violare 1: DELETE direct pe neurons
DELETE FROM public.neurons WHERE id = 1;

-- Violare 2: DELETE cu JOIN pe neurons
DELETE FROM public.neurons n 
USING public.bundles b 
WHERE n.bundle_id = b.id AND b.active = false;

-- Violare 3: DELETE cu subquery pe neurons
DELETE FROM public.neurons 
WHERE id IN (SELECT neuron_id FROM neuron_assets WHERE asset_type = 'deleted');

-- Violare 4: DELETE cu alias pe neurons
DELETE n FROM public.neurons n 
WHERE n.published = false AND n.created_at < NOW() - INTERVAL '1 year';

-- Violare 5: DELETE complex pe neurons
DELETE FROM public.neurons 
WHERE bundle_id IN (
  SELECT id FROM public.bundles WHERE active = false
) AND published = false;
