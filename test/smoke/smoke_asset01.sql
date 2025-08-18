-- Test ASSET-01: assets fără published check
-- Acest fișier ar trebui să genereze violări ASSET-01

-- Violare 1: SELECT direct pe neuron_assets fără published check
SELECT * FROM neuron_assets WHERE neuron_id = 1;

-- Violare 2: SELECT cu alias pe neuron_assets fără published check
SELECT na.* FROM neuron_assets na 
WHERE na.asset_type = 'image';

-- Violare 3: SELECT cu JOIN pe neuron_assets fără published check
SELECT na.*, n.title 
FROM neuron_assets na
JOIN public.neurons n ON na.neuron_id = n.id
WHERE na.asset_type = 'document';

-- Violare 4: SELECT cu subquery pe neuron_assets fără published check
SELECT * FROM neuron_assets 
WHERE neuron_id IN (
  SELECT id FROM public.neurons WHERE bundle_id = 1
);

-- Violare 5: SELECT complex pe neuron_assets fără published check
SELECT 
  na.id,
  na.asset_type,
  na.file_path,
  n.title as neuron_title
FROM neuron_assets na
JOIN public.neurons n ON na.neuron_id = n.id
WHERE na.created_at > NOW() - INTERVAL '1 month';
