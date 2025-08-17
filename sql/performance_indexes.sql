-- ============================================================================
-- PERFORMANCE INDEXES - Indexuri suplimentare pentru optimizarea performanței
-- ============================================================================
-- 
-- Acest fișier conține indexuri suplimentare pentru:
-- - Căutări rapide în neuroni
-- - Filtrare pe tier și status
-- - Căutare text și slug
-- - Optimizare pentru tree queries
-- - Indexuri pentru subscription-uri
-- ============================================================================

-- === 1. INDEXURI PENTRU NEURONI ===

-- Index compus pentru căutări frecvente
CREATE INDEX IF NOT EXISTS idx_neurons_tier_published_deleted 
ON public.neurons (required_tier, published, deleted_at) 
WHERE published = true AND deleted_at IS NULL;

-- Index pentru căutări pe cognitive_category
CREATE INDEX IF NOT EXISTS idx_neurons_cognitive_category 
ON public.neurons (cognitive_category) 
WHERE published = true AND deleted_at IS NULL;

-- Index pentru căutări pe difficulty_tier
CREATE INDEX IF NOT EXISTS idx_neurons_difficulty_tier 
ON public.neurons (difficulty_tier) 
WHERE published = true AND deleted_at IS NULL;

-- Index pentru căutări pe cognitive_depth_score
CREATE INDEX IF NOT EXISTS idx_neurons_depth_score 
ON public.neurons (cognitive_depth_score) 
WHERE published = true AND deleted_at IS NULL;

-- Index pentru căutări pe pattern_complexity
CREATE INDEX IF NOT EXISTS idx_neurons_pattern_complexity 
ON public.neurons (pattern_complexity) 
WHERE published = true AND deleted_at IS NULL;

-- Index pentru căutări pe pricing_tier
CREATE INDEX IF NOT EXISTS idx_neurons_pricing_tier 
ON public.neurons (pricing_tier) 
WHERE published = true AND deleted_at IS NULL;

-- Index pentru căutări pe slug (case insensitive)
CREATE INDEX IF NOT EXISTS idx_neurons_slug_ci 
ON public.neurons (LOWER(slug)) 
WHERE published = true AND deleted_at IS NULL;

-- Index pentru căutări pe title (case insensitive)
CREATE INDEX IF NOT EXISTS idx_neurons_title_ci 
ON public.neurons (LOWER(title)) 
WHERE published = true AND deleted_at IS NULL;

-- === 2. INDEXURI PENTRU BUNDLE-URI ===

-- Index compus pentru bundle-uri
CREATE INDEX IF NOT EXISTS idx_bundles_tier_deleted 
ON public.bundles (required_tier, deleted_at) 
WHERE deleted_at IS NULL;

-- Index pentru căutări pe slug
CREATE INDEX IF NOT EXISTS idx_bundles_slug_ci 
ON public.bundles (LOWER(slug)) 
WHERE deleted_at IS NULL;

-- Index pentru căutări pe title
CREATE INDEX IF NOT EXISTS idx_bundles_title_ci 
ON public.bundles (LOWER(title)) 
WHERE deleted_at IS NULL;

-- === 3. INDEXURI PENTRU LIBRARY TREE ===

-- Index pentru căutări pe path
CREATE INDEX IF NOT EXISTS idx_library_tree_path 
ON public.library_tree (path) 
WHERE deleted_at IS NULL;

-- Index pentru căutări pe parent_id
CREATE INDEX IF NOT EXISTS idx_library_tree_parent_id 
ON public.library_tree (parent_id) 
WHERE deleted_at IS NULL;

-- Index pentru căutări pe position
CREATE INDEX IF NOT EXISTS idx_library_tree_position 
ON public.library_tree (position) 
WHERE deleted_at IS NULL;

-- Index pentru căutări pe name
CREATE INDEX IF NOT EXISTS idx_library_tree_name_ci 
ON public.library_tree (LOWER(name)) 
WHERE deleted_at IS NULL;

-- === 4. INDEXURI PENTRU USER SUBSCRIPTIONS ===

-- Index compus pentru subscription-uri active
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active 
ON public.user_subscriptions (user_id, status, current_period_end) 
WHERE status = 'active';

-- Index pentru căutări pe tier
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier 
ON public.user_subscriptions (tier) 
WHERE status = 'active';

-- Index pentru căutări pe stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id 
ON public.user_subscriptions (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- === 5. INDEXURI PENTRU RELAȚII ===

-- Index pentru library_tree_neurons
CREATE INDEX IF NOT EXISTS idx_library_tree_neurons_tree_id 
ON public.library_tree_neurons (tree_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_library_tree_neurons_neuron_id 
ON public.library_tree_neurons (neuron_id) 
WHERE deleted_at IS NULL;

-- Index pentru bundle_neurons
CREATE INDEX IF NOT EXISTS idx_bundle_neurons_bundle_id 
ON public.bundle_neurons (bundle_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bundle_neurons_neuron_id 
ON public.bundle_neurons (neuron_id) 
WHERE deleted_at IS NULL;

-- === 6. INDEXURI PENTRU CĂUTARE TEXT ===

-- Index GIN pentru căutări full-text în title și description
CREATE INDEX IF NOT EXISTS idx_neurons_title_description_gin 
ON public.neurons USING gin(to_tsvector('english', title || ' ' || COALESCE(description, ''))) 
WHERE published = true AND deleted_at IS NULL;

-- Index GIN pentru căutări full-text în bundle title și description
CREATE INDEX IF NOT EXISTS idx_bundles_title_description_gin 
ON public.bundles USING gin(to_tsvector('english', title || ' ' || COALESCE(description, ''))) 
WHERE deleted_at IS NULL;

-- === 7. INDEXURI PENTRU TIMESTAMP ===

-- Index pentru căutări pe created_at
CREATE INDEX IF NOT EXISTS idx_neurons_created_at 
ON public.neurons (created_at DESC) 
WHERE published = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bundles_created_at 
ON public.bundles (created_at DESC) 
WHERE deleted_at IS NULL;

-- === 8. INDEXURI PENTRU SOFT DELETE ===

-- Index pentru cleanup-ul soft delete
CREATE INDEX IF NOT EXISTS idx_neurons_deleted_at_cleanup 
ON public.neurons (deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bundles_deleted_at_cleanup 
ON public.bundles (deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_library_tree_deleted_at_cleanup 
ON public.library_tree (deleted_at) 
WHERE deleted_at IS NOT NULL;

-- === 9. VERIFICARE INDEXURI ===

-- Funcție pentru verificarea indexurilor
CREATE OR REPLACE FUNCTION f_check_performance_indexes()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_type text,
  columns text,
  is_unique boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.tablename::text,
    i.indexname::text,
    am.amname::text,
    array_to_string(array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)), ', ')::text,
    i.indisunique
  FROM pg_index i
  JOIN pg_class t ON t.oid = i.indrelid
  JOIN pg_class ix ON ix.oid = i.indexrelid
  JOIN pg_am am ON am.oid = ix.relam
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
  WHERE t.relname IN ('neurons', 'bundles', 'library_tree', 'user_subscriptions', 'library_tree_neurons', 'bundle_neurons')
    AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  GROUP BY t.tablename, i.indexname, am.amname, i.indisunique
  ORDER BY t.tablename, i.indexname;
$$;

-- === 10. ANALIZĂ PERFORMANȚĂ ===

-- Funcție pentru analiza performanței indexurilor
CREATE OR REPLACE FUNCTION f_analyze_index_performance()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_scans bigint,
  index_tuples_read bigint,
  index_tuples_fetched bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    schemaname::text,
    indexrelname::text,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND relname IN ('neurons', 'bundles', 'library_tree', 'user_subscriptions')
  ORDER BY idx_scan DESC;
$$;

-- === 11. COMENTARII ===

COMMENT ON INDEX idx_neurons_tier_published_deleted IS 'Index compus pentru căutări frecvente în neuroni';
COMMENT ON INDEX idx_neurons_cognitive_category IS 'Index pentru filtrarea pe categorii cognitive';
COMMENT ON INDEX idx_neurons_difficulty_tier IS 'Index pentru filtrarea pe nivel de dificultate';
COMMENT ON INDEX idx_neurons_depth_score IS 'Index pentru căutări pe scorul de adâncime';
COMMENT ON INDEX idx_neurons_pattern_complexity IS 'Index pentru căutări pe complexitatea pattern-ului';
COMMENT ON INDEX idx_neurons_pricing_tier IS 'Index pentru filtrarea pe tier-ul de preț';
COMMENT ON INDEX idx_neurons_slug_ci IS 'Index case-insensitive pentru slug-uri';
COMMENT ON INDEX idx_neurons_title_ci IS 'Index case-insensitive pentru titluri';
COMMENT ON INDEX idx_neurons_title_description_gin IS 'Index GIN pentru căutări full-text';

-- === 12. FINALIZARE ===

DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Composite indexes for common queries';
  RAISE NOTICE '- Case-insensitive search indexes';
  RAISE NOTICE '- Full-text search indexes (GIN)';
  RAISE NOTICE '- Soft delete cleanup indexes';
  RAISE NOTICE '- Subscription status indexes';
  RAISE NOTICE '- Tree path optimization indexes';
END $$;
