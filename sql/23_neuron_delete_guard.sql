-- 23_neuron_delete_guard.sql
-- Delete Guards + Soft-Delete: protejează conținutul de ștergeri accidentale
-- Implementează soft-delete cu istoric complet, delete guards pentru referințe,
-- și cleanup automat pentru datele vechi (90+ zile)
-- Context: Postgres + Supabase (RLS activat, admin-only pentru soft-delete)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === 1. SOFT-DELETE: coloane de audit pe tabelele critice ===

-- neurons (conținutul principal)
ALTER TABLE public.neurons 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- bundles (colecții)
ALTER TABLE public.bundles 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- plans (abonamente)
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- === 2. DELETE GUARDS: funcții de verificare referințe ===

-- Verifică dacă un neuron poate fi șters (nu e referit în bundle-uri active)
CREATE OR REPLACE FUNCTION public.f_can_delete_neuron(p_neuron_id uuid)
RETURNS TABLE(
  can_delete boolean,
  reason text,
  active_bundles text[],
  active_subscriptions int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bundles text[];
  v_subscriptions int;
BEGIN
  -- Verifică bundle-uri active care conțin neuronul
  SELECT ARRAY_AGG(b.title ORDER BY b.title)
  INTO v_bundles
  FROM public.bundles b
  JOIN public.bundle_neurons bn ON bn.bundle_id = b.id
  WHERE bn.neuron_id = p_neuron_id 
    AND b.deleted_at IS NULL;
  
  -- Verifică abonamente active care au acces la neuronul
  SELECT COUNT(DISTINCT us.user_id)
  INTO v_subscriptions
  FROM public.user_subscriptions us
  JOIN public.neurons n ON n.required_tier <= us.plan_tier
  WHERE n.id = p_neuron_id 
    AND us.status = 'active'
    AND us.expires_at > now();
  
  -- Poate fi șters doar dacă nu e referit în bundle-uri active
  -- și nu are abonamente active (soft-delete doar)
  RETURN QUERY
  SELECT 
    CASE 
      WHEN array_length(v_bundles, 1) IS NULL AND v_subscriptions = 0 THEN true
      ELSE false
    END AS can_delete,
    CASE 
      WHEN array_length(v_bundles, 1) IS NOT NULL THEN 
        'Neuron referit în bundle-uri active: ' || array_to_string(v_bundles, ', ')
      WHEN v_subscriptions > 0 THEN 
        'Neuron accesibil prin ' || v_subscriptions || ' abonamente active'
      ELSE 'Neuron poate fi șters'
    END AS reason,
    COALESCE(v_bundles, ARRAY[]::text[]) AS active_bundles,
    v_subscriptions AS active_subscriptions;
END
$$;

-- Verifică dacă un bundle poate fi șters
CREATE OR REPLACE FUNCTION public.f_can_delete_bundle(p_bundle_id uuid)
RETURNS TABLE(
  can_delete boolean,
  reason text,
  active_subscriptions int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscriptions int;
BEGIN
  -- Verifică abonamente active care au acces la bundle
  SELECT COUNT(DISTINCT us.user_id)
  INTO v_subscriptions
  FROM public.user_subscriptions us
  JOIN public.bundles b ON b.required_tier <= us.plan_tier
  WHERE b.id = p_bundle_id 
    AND us.status = 'active'
    AND us.expires_at > now();
  
  RETURN QUERY
  SELECT 
    v_subscriptions = 0 AS can_delete,
    CASE 
      WHEN v_subscriptions > 0 THEN 
        'Bundle accesibil prin ' || v_subscriptions || ' abonamente active'
      ELSE 'Bundle poate fi șters'
    END AS reason,
    v_subscriptions AS active_subscriptions;
END
$$;

-- === 3. SOFT-DELETE FUNCTIONS (admin-only) ===

-- Soft-delete neuron (admin only)
CREATE OR REPLACE FUNCTION public.f_soft_delete_neuron(
  p_neuron_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_delete record;
  v_user_id uuid;
BEGIN
  -- Verifică dacă user-ul e admin
  IF NOT public.f_is_admin_current_user() THEN
    RAISE EXCEPTION 'Only admins can soft-delete neurons';
  END IF;
  
  -- Verifică dacă poate fi șters
  SELECT * INTO v_can_delete FROM public.f_can_delete_neuron(p_neuron_id);
  IF NOT v_can_delete.can_delete THEN
    RAISE EXCEPTION 'Cannot delete neuron: %', v_can_delete.reason;
  END IF;
  
  -- Obține user ID-ul curent
  v_user_id := auth.uid();
  
  -- Soft-delete neuronul
  UPDATE public.neurons 
  SET 
    deleted_at = now(),
    deleted_by = v_user_id,
    deletion_reason = p_reason
  WHERE id = p_neuron_id;
  
  -- Soft-delete din bundle_neurons (cascade logic)
  UPDATE public.bundle_neurons 
  SET deleted_at = now()
  WHERE neuron_id = p_neuron_id;
  
  RETURN FOUND;
END
$$;

-- Soft-delete bundle (admin only)
CREATE OR REPLACE FUNCTION public.f_soft_delete_bundle(
  p_bundle_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_delete record;
  v_user_id uuid;
BEGIN
  -- Verifică dacă user-ul e admin
  IF NOT public.f_is_admin_current_user() THEN
    RAISE EXCEPTION 'Only admins can soft-delete bundles';
  END IF;
  
  -- Verifică dacă poate fi șters
  SELECT * INTO v_can_delete FROM public.f_can_delete_bundle(p_bundle_id);
  IF NOT v_can_delete.can_delete THEN
    RAISE EXCEPTION 'Cannot delete bundle: %', v_can_delete.reason';
  END IF;
  
  -- Obține user ID-ul curent
  v_user_id := auth.uid();
  
  -- Soft-delete bundle-ul
  UPDATE public.bundles 
  SET 
    deleted_at = now(),
    deleted_by = v_user_id,
    deletion_reason = p_reason
  WHERE id = p_bundle_id;
  
  -- Soft-delete din bundle_neurons (cascade logic)
  UPDATE public.bundle_neurons 
  SET deleted_at = now()
  WHERE bundle_id = p_bundle_id;
  
  RETURN FOUND;
END
$$;

-- === 4. RESTORE FUNCTIONS (admin only) ===

-- Restore neuron
CREATE OR REPLACE FUNCTION public.f_restore_neuron(p_neuron_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifică dacă user-ul e admin
  IF NOT public.f_is_admin_current_user() THEN
    RAISE EXCEPTION 'Only admins can restore neurons';
  END IF;
  
  -- Restore neuronul
  UPDATE public.neurons 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL
  WHERE id = p_neuron_id;
  
  -- Restore din bundle_neurons
  UPDATE public.bundle_neurons 
  SET deleted_at = NULL
  WHERE neuron_id = p_neuron_id;
  
  RETURN FOUND;
END
$$;

-- Restore bundle
CREATE OR REPLACE FUNCTION public.f_restore_bundle(p_bundle_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifică dacă user-ul e admin
  IF NOT public.f_is_admin_current_user() THEN
    RAISE EXCEPTION 'Only admins can restore bundles';
  END IF;
  
  -- Restore bundle-ul
  UPDATE public.bundles 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL
  WHERE id = p_bundle_id;
  
  -- Restore din bundle_neurons
  UPDATE public.bundle_neurons 
  SET deleted_at = NULL
  WHERE bundle_id = p_bundle_id;
  
  RETURN FOUND;
END
$$;

-- === 5. HARD-DELETE FUNCTIONS (admin only, cu verificări stricte) ===

-- Hard-delete neuron (doar dacă e complet izolat)
CREATE OR REPLACE FUNCTION public.f_hard_delete_neuron(p_neuron_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_delete record;
  v_user_id uuid;
BEGIN
  -- Verifică dacă user-ul e admin
  IF NOT public.f_is_admin_current_user() THEN
    RAISE EXCEPTION 'Only admins can hard-delete neurons';
  END IF;
  
  -- Verifică dacă poate fi șters
  SELECT * INTO v_can_delete FROM public.f_can_delete_neuron(p_neuron_id);
  IF NOT v_can_delete.can_delete THEN
    RAISE EXCEPTION 'Cannot hard-delete neuron: %', v_can_delete.reason;
  END IF;
  
  -- Verifică că e deja soft-deleted
  IF NOT EXISTS (SELECT 1 FROM public.neurons WHERE id = p_neuron_id AND deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Neuron must be soft-deleted before hard-delete';
  END IF;
  
  -- Obține user ID-ul curent
  v_user_id := auth.uid();
  
  -- Hard-delete (cascade prin FK-uri)
  DELETE FROM public.neurons WHERE id = p_neuron_id;
  
  RETURN FOUND;
END
$$;

-- === 6. CLEANUP AUTOMAT: curăță datele vechi (90+ zile) ===

-- Funcție de cleanup pentru datele soft-deleted vechi
CREATE OR REPLACE FUNCTION public.f_cleanup_old_deleted_data()
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
  v_cleanup_date timestamptz := now() - interval '90 days';
  v_neurons_deleted int;
  v_bundles_deleted int;
  v_bundle_neurons_deleted int;
BEGIN
  -- Verifică dacă user-ul e admin
  IF NOT public.f_is_admin_current_user() THEN
    RAISE EXCEPTION 'Only admins can run cleanup';
  END IF;
  
  -- Cleanup neurons vechi (90+ zile)
  DELETE FROM public.neurons 
  WHERE deleted_at < v_cleanup_date;
  GET DIAGNOSTICS v_neurons_deleted = ROW_COUNT;
  
  -- Cleanup bundles vechi
  DELETE FROM public.bundles 
  WHERE deleted_at < v_cleanup_date;
  GET DIAGNOSTICS v_bundles_deleted = ROW_COUNT;
  
  -- Cleanup bundle_neurons vechi
  DELETE FROM public.bundle_neurons 
  WHERE deleted_at < v_cleanup_date;
  GET DIAGNOSTICS v_bundle_neurons_deleted = ROW_COUNT;
  
  RETURN QUERY
  SELECT 'neurons'::text, v_neurons_deleted, v_cleanup_date
  UNION ALL
  SELECT 'bundles'::text, v_bundles_deleted, v_cleanup_date
  UNION ALL
  SELECT 'bundle_neurons'::text, v_bundle_neurons_deleted, v_cleanup_date;
END
$$;

-- === 7. VIEWS PENTRU ADMIN: vizualizează conținutul șters ===

-- View pentru neurons șterși
CREATE OR REPLACE VIEW public.v_neurons_deleted AS
SELECT 
  n.id,
  n.slug,
  n.title,
  n.summary,
  n.deleted_at,
  u.email AS deleted_by_email,
  n.deletion_reason,
  -- Referințe active (dacă există)
  (SELECT COUNT(*) FROM public.bundle_neurons bn 
   WHERE bn.neuron_id = n.id AND bn.deleted_at IS NULL) AS active_bundle_refs
FROM public.neurons n
LEFT JOIN auth.users u ON u.id = n.deleted_by
WHERE n.deleted_at IS NOT NULL
ORDER BY n.deleted_at DESC;

-- View pentru bundles șterși
CREATE OR REPLACE VIEW public.v_bundles_deleted AS
SELECT 
  b.id,
  b.slug,
  b.title,
  b.description,
  b.deleted_at,
  u.email AS deleted_by_email,
  b.deletion_reason,
  -- Neuroni în bundle
  (SELECT COUNT(*) FROM public.bundle_neurons bn 
   WHERE bn.bundle_id = b.id AND bn.deleted_at IS NULL) AS active_neuron_refs
FROM public.bundles b
LEFT JOIN auth.users u ON u.id = b.deleted_by
WHERE b.deleted_at IS NOT NULL
ORDER BY b.deleted_at DESC;

-- === 8. RLS POLICIES: protejează conținutul șters ===

-- Neurons: doar published=true și deleted_at IS NULL
DROP POLICY IF EXISTS neurons_select_public ON public.neurons;
CREATE POLICY neurons_select_public
  ON public.neurons
  FOR SELECT
  TO anon, authenticated
  USING (published = true AND deleted_at IS NULL);

-- Bundles: doar deleted_at IS NULL
DROP POLICY IF EXISTS bundles_select_public ON public.bundles;
CREATE POLICY bundles_select_public
  ON public.bundles
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Bundle neurons: doar deleted_at IS NULL
DROP POLICY IF EXISTS bundle_neurons_select_public ON public.bundle_neurons;
CREATE POLICY bundle_neurons_select_public
  ON public.bundle_neurons
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- === 9. EXPUNERE FUNCȚII: doar admin ===

-- Revoke public access
REVOKE ALL ON FUNCTION public.f_can_delete_neuron(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.f_can_delete_bundle(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.f_soft_delete_neuron(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.f_soft_delete_bundle(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.f_restore_neuron(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.f_restore_bundle(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.f_hard_delete_neuron(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.f_cleanup_old_deleted_data() FROM PUBLIC, anon, authenticated;

-- Grant admin access
GRANT EXECUTE ON FUNCTION public.f_can_delete_neuron(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_can_delete_bundle(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_soft_delete_neuron(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_soft_delete_bundle(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_restore_neuron(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_restore_bundle(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_hard_delete_neuron(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_cleanup_old_deleted_data() TO authenticated;

-- Views: doar admin
REVOKE ALL ON public.v_neurons_deleted FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_bundles_deleted FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_neurons_deleted TO authenticated;
GRANT SELECT ON public.v_bundles_deleted TO authenticated;

-- === 10. EXEMPLE DE UTILIZARE (admin) ===

-- Verifică dacă un neuron poate fi șters
-- SELECT * FROM public.f_can_delete_neuron('neuron-uuid-here');

-- Soft-delete neuron
-- SELECT public.f_soft_delete_neuron('neuron-uuid-here', 'Content outdated');

-- Restore neuron
-- SELECT public.f_restore_neuron('neuron-uuid-here');

-- Hard-delete neuron (doar după soft-delete)
-- SELECT public.f_hard_delete_neuron('neuron-uuid-here');

-- Cleanup automat
-- SELECT * FROM public.f_cleanup_old_deleted_data();

-- Vizualizează conținutul șters
-- SELECT * FROM public.v_neurons_deleted;
-- SELECT * FROM public.v_bundles_deleted;

-- === 11. BACKFILL: adaugă coloanele de soft-delete la datele existente ===

-- Asigură-te că toate datele existente au deleted_at = NULL
UPDATE public.neurons SET deleted_at = NULL WHERE deleted_at IS NULL;
UPDATE public.bundles SET deleted_at = NULL WHERE deleted_at IS NULL;
UPDATE public.bundle_neurons SET deleted_at = NULL WHERE deleted_at IS NULL;

-- === 12. Verdict simbolic ===

-- Protejează conținutul de ștergeri accidentale — 
-- soft-delete cu istoric complet, delete guards pentru referințe,
-- și cleanup automat pentru datele vechi.
