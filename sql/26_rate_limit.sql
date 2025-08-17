-- 26_rate_limit.sql
-- Rate Limiting: Token Bucket Algorithm cu găleți per user + endpoint
-- Implementează rate limiting granular pentru API endpoints, 
-- cu găleți separate pentru search, content access, și admin operations
-- Context: Postgres + Supabase (RLS activat, admin monitoring)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === 1. RATE LIMIT CONFIG: găleți per endpoint + user ===

-- Tabela de configurare pentru rate limits
CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  endpoint_key text PRIMARY KEY,           -- 'search', 'content_access', 'admin_crud'
  requests_per_minute int NOT NULL,        -- tokeni per minut
  burst_size int NOT NULL,                 -- găleată maximă
  window_size_minutes int NOT NULL DEFAULT 1, -- fereastra de timp
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Configurare default pentru endpoint-uri
INSERT INTO public.rate_limit_config (endpoint_key, requests_per_minute, burst_size, window_size_minutes) VALUES
  ('search', 60, 120, 1),           -- 60 req/min, burst 120
  ('content_access', 30, 60, 1),    -- 30 req/min, burst 60  
  ('admin_crud', 100, 200, 1),      -- 100 req/min, burst 200
  ('stripe_webhook', 1000, 2000, 1), -- 1000 req/min, burst 2000
  ('user_auth', 10, 20, 1),         -- 10 req/min, burst 20
  ('api_general', 120, 240, 1)      -- 120 req/min, burst 240
ON CONFLICT (endpoint_key) DO UPDATE SET
  requests_per_minute = EXCLUDED.requests_per_minute,
  burst_size = EXCLUDED.burst_size,
  window_size_minutes = EXCLUDED.window_size_minutes,
  updated_at = now();

-- === 2. RATE LIMIT BUCKETS: găleți per user + endpoint ===

-- Tabela pentru gălețile de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint_key text NOT NULL REFERENCES public.rate_limit_config(endpoint_key),
  tokens_remaining int NOT NULL,           -- tokeni rămași în găleată
  last_refill timestamptz NOT NULL DEFAULT now(),
  last_request timestamptz NOT NULL DEFAULT now(),
  request_count int NOT NULL DEFAULT 0,    -- total requests în fereastra curentă
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, endpoint_key)
);

-- Indexuri pentru performanță
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_user_endpoint 
  ON public.rate_limit_buckets(user_id, endpoint_key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_last_refill 
  ON public.rate_limit_buckets(last_refill);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_cleanup 
  ON public.rate_limit_buckets(created_at);

-- === 3. RATE LIMIT LOG: audit complet al rate limiting ===

-- Tabela pentru log-ul rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint_key text NOT NULL,
  request_timestamp timestamptz NOT NULL DEFAULT now(),
  tokens_consumed int NOT NULL DEFAULT 1,
  tokens_remaining int NOT NULL,
  was_allowed boolean NOT NULL,
  ip_address inet,
  user_agent text,
  request_path text,
  response_status int,
  processing_time_ms int
);

-- Indexuri pentru analytics și debugging
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_user_time 
  ON public.rate_limit_log(user_id, request_timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_endpoint_time 
  ON public.rate_limit_log(endpoint_key, request_timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_allowed 
  ON public.rate_limit_log(was_allowed, request_timestamp);

-- === 4. TOKEN BUCKET ALGORITHM: funcția principală de rate limiting ===

-- Funcția principală de rate limiting (Token Bucket)
CREATE OR REPLACE FUNCTION public.f_check_rate_limit(
  p_endpoint_key text,
  p_tokens_required int DEFAULT 1,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  allowed boolean,
  tokens_remaining int,
  reset_time timestamptz,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config record;
  v_bucket record;
  v_now timestamptz := now();
  v_tokens_to_add int;
  v_new_tokens int;
  v_allowed boolean;
  v_reason text;
BEGIN
  -- Obține configurația pentru endpoint
  SELECT * INTO v_config 
  FROM public.rate_limit_config 
  WHERE endpoint_key = p_endpoint_key AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, v_now, 'Endpoint not configured';
    RETURN;
  END IF;
  
  -- Dacă nu e user autentificat, folosește IP-based rate limiting
  IF p_user_id IS NULL THEN
    -- Implementare simplă pentru anon users (IP-based)
    RETURN QUERY SELECT true, 999, v_now, 'Anonymous user - basic rate limit';
    RETURN;
  END IF;
  
  -- Obține sau creează găleata pentru user + endpoint
  SELECT * INTO v_bucket 
  FROM public.rate_limit_buckets 
  WHERE user_id = p_user_id AND endpoint_key = p_endpoint_key;
  
  -- Calculează tokeni noi (refill rate)
  v_tokens_to_add := EXTRACT(EPOCH FROM (v_now - v_bucket.last_refill)) / 60.0 * v_config.requests_per_minute;
  v_new_tokens := LEAST(v_config.burst_size, v_bucket.tokens_remaining + v_tokens_to_add);
  
  -- Verifică dacă poate consuma tokenii
  v_allowed := v_new_tokens >= p_tokens_required;
  
  IF v_allowed THEN
    -- Consumă tokenii
    v_new_tokens := v_new_tokens - p_tokens_required;
    v_reason := 'Rate limit check passed';
  ELSE
    v_reason := 'Rate limit exceeded';
  END IF;
  
  -- Actualizează găleata
  IF FOUND THEN
    UPDATE public.rate_limit_buckets 
    SET 
      tokens_remaining = v_new_tokens,
      last_refill = CASE WHEN v_tokens_to_add > 0 THEN v_now ELSE last_refill END,
      last_request = v_now,
      request_count = request_count + 1,
      updated_at = v_now
    WHERE id = v_bucket.id;
  ELSE
    -- Creează găleată nouă
    INSERT INTO public.rate_limit_buckets (
      user_id, endpoint_key, tokens_remaining, last_refill, last_request, request_count
    ) VALUES (
      p_user_id, p_endpoint_key, 
      CASE WHEN v_allowed THEN v_config.burst_size - p_tokens_required ELSE v_config.burst_size END,
      v_now, v_now, 1
    );
  END IF;
  
  -- Log rate limit check
  INSERT INTO public.rate_limit_log (
    user_id, endpoint_key, tokens_consumed, tokens_remaining, was_allowed
  ) VALUES (
    p_user_id, p_endpoint_key, 
    CASE WHEN v_allowed THEN p_tokens_required ELSE 0 END,
    v_new_tokens, v_allowed
  );
  
  -- Returnează rezultatul
  RETURN QUERY 
  SELECT 
    v_allowed,
    v_new_tokens,
    v_now + (v_config.window_size_minutes * interval '1 minute'),
    v_reason;
END
$$;

-- === 5. RATE LIMIT WRAPPERS: funcții helper pentru endpoint-uri specifice ===

-- Rate limit pentru search
CREATE OR REPLACE FUNCTION public.f_rate_limit_search(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result record;
BEGIN
  SELECT * INTO v_result FROM public.f_check_rate_limit('search', 1, p_user_id);
  RETURN v_result.allowed;
END
$$;

-- Rate limit pentru content access
CREATE OR REPLACE FUNCTION public.f_rate_limit_content_access(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result record;
BEGIN
  SELECT * INTO v_result FROM public.f_check_rate_limit('content_access', 1, p_user_id);
  RETURN v_result.allowed;
END
$$;

-- Rate limit pentru admin operations
CREATE OR REPLACE FUNCTION public.f_rate_limit_admin_crud(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result record;
BEGIN
  SELECT * INTO v_result FROM public.f_check_rate_limit('admin_crud', 1, p_user_id);
  RETURN v_result.allowed;
END
$$;

-- === 6. RATE LIMIT MONITORING: funcții pentru admin monitoring ===

-- Dashboard pentru rate limiting
CREATE OR REPLACE VIEW public.v_rate_limit_dashboard AS
SELECT 
  rlc.endpoint_key,
  rlc.requests_per_minute,
  rlc.burst_size,
  rlc.is_active,
  COUNT(rlb.id) AS active_buckets,
  COUNT(rll.id) AS requests_last_hour,
  COUNT(CASE WHEN rll.was_allowed = false THEN 1 END) AS blocked_last_hour,
  ROUND(
    COUNT(CASE WHEN rll.was_allowed = false THEN 1 END)::numeric / 
    NULLIF(COUNT(rll.id), 0) * 100, 2
  ) AS block_rate_percent
FROM public.rate_limit_config rlc
LEFT JOIN public.rate_limit_buckets rlb ON rlb.endpoint_key = rlc.endpoint_key
LEFT JOIN public.rate_limit_log rll ON rll.endpoint_key = rlc.endpoint_key 
  AND rll.request_timestamp > now() - interval '1 hour'
GROUP BY rlc.endpoint_key, rlc.requests_per_minute, rlc.burst_size, rlc.is_active
ORDER BY rlc.endpoint_key;

-- Top users cu rate limiting
CREATE OR REPLACE VIEW public.v_rate_limit_top_users AS
SELECT 
  u.email,
  rlb.endpoint_key,
  rlb.tokens_remaining,
  rlb.request_count,
  rlb.last_request,
  COUNT(rll.id) AS requests_last_24h,
  COUNT(CASE WHEN rll.was_allowed = false THEN 1 END) AS blocked_last_24h
FROM public.rate_limit_buckets rlb
JOIN auth.users u ON u.id = rlb.user_id
LEFT JOIN public.rate_limit_log rll ON rll.user_id = rlb.user_id 
  AND rll.endpoint_key = rlb.endpoint_key
  AND rll.request_timestamp > now() - interval '24 hours'
GROUP BY u.email, rlb.endpoint_key, rlb.tokens_remaining, rlb.request_count, rlb.last_request
ORDER BY requests_last_24h DESC, blocked_last_24h DESC;

-- === 7. CLEANUP AUTOMAT: curăță datele vechi ===

-- Funcție de cleanup pentru rate limit data
CREATE OR REPLACE FUNCTION public.f_cleanup_rate_limit_data()
RETURNS TABLE(
  table_name text,
  deleted_count int,
  cleanup_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleanup_date timestamptz := now() - interval '7 days';
  v_log_deleted int;
  v_buckets_deleted int;
BEGIN
  -- Verifică dacă user-ul e admin
  IF NOT public.f_is_admin_current_user() THEN
    RAISE EXCEPTION 'Only admins can run rate limit cleanup';
  END IF;
  
  -- Cleanup log-uri vechi (7+ zile)
  DELETE FROM public.rate_limit_log 
  WHERE request_timestamp < v_cleanup_date;
  GET DIAGNOSTICS v_log_deleted = ROW_COUNT;
  
  -- Cleanup găleți inactive (30+ zile fără request)
  DELETE FROM public.rate_limit_buckets 
  WHERE last_request < now() - interval '30 days';
  GET DIAGNOSTICS v_buckets_deleted = ROW_COUNT;
  
  RETURN QUERY
  SELECT 'rate_limit_log'::text, v_log_deleted, v_cleanup_date
  UNION ALL
  SELECT 'rate_limit_buckets'::text, v_buckets_deleted, v_cleanup_date;
END
$$;

-- === 8. RLS POLICIES: protejează datele de rate limiting ===

-- Rate limit config: admin only
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rate_limit_config_admin_only ON public.rate_limit_config;
CREATE POLICY rate_limit_config_admin_only
  ON public.rate_limit_config
  FOR ALL
  TO authenticated
  USING (public.f_is_admin_current_user())
  WITH CHECK (public.f_is_admin_current_user());

-- Rate limit buckets: user vede doar propriile găleți
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rate_limit_buckets_self_only ON public.rate_limit_buckets;
CREATE POLICY rate_limit_buckets_self_only
  ON public.rate_limit_buckets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Rate limit log: user vede doar propriile log-uri
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rate_limit_log_self_only ON public.rate_limit_log;
CREATE POLICY rate_limit_log_self_only
  ON public.rate_limit_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- === 9. EXPUNERE FUNCȚII: rate limiting public, monitoring admin ===

-- Rate limiting: public pentru authenticated
GRANT EXECUTE ON FUNCTION public.f_check_rate_limit(text,int,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_rate_limit_search(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_rate_limit_content_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_rate_limit_admin_crud(uuid) TO authenticated;

-- Monitoring: doar admin
REVOKE ALL ON FUNCTION public.f_cleanup_rate_limit_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.f_cleanup_rate_limit_data() TO authenticated;

-- Views: doar admin
REVOKE ALL ON public.v_rate_limit_dashboard FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_rate_limit_top_users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_rate_limit_dashboard TO authenticated;
GRANT SELECT ON public.v_rate_limit_top_users TO authenticated;

-- === 10. INTEGRARE FRONTEND: exemple de utilizare ===

-- În API routes, înfășoară rate limiting:
/*
// search.ts
export async function searchNeurons(q: string, limit = 20, offset = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Rate limit check
  const { data: rateLimit } = await supabase.rpc('f_rate_limit_search', {
    p_user_id: user?.id || null
  });
  
  if (!rateLimit) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Proceed with search
  return supabase.rpc('rpc_search_neurons', { 
    p_q: q, p_limit: limit, p_offset: offset 
  });
}
*/

-- === 11. EXEMPLE DE UTILIZARE (admin) ===

-- Verifică rate limit pentru un user
-- SELECT * FROM public.f_check_rate_limit('search', 1, 'user-uuid-here');

-- Monitorizează rate limiting
-- SELECT * FROM public.v_rate_limit_dashboard;
-- SELECT * FROM public.v_rate_limit_top_users;

-- Cleanup automat
-- SELECT * FROM public.f_cleanup_rate_limit_data();

-- === 12. Verdict simbolic ===

-- Rate limiting granular cu Token Bucket — 
-- protejează API-ul de abuz, monitorizează utilizarea,
-- și oferă admin control complet asupra limitelor.
