-- ============================================================================
-- ASSET-01 VALIDATION POLICIES
-- ============================================================================
-- 
-- Implementează validarea pentru accesul la neuron_assets:
-- - Asigură că accesul la neuron_assets verifică neurons.published=true
-- - Aplică politici RLS cu condiții EXISTS
-- - Previne accesul la assets pentru neuroni nepublicați
--
-- Caracteristici:
-- - Idempotent (poate fi rulat de mai multe ori)
-- - Compatibil cu schema existentă
-- - Politici RLS restrictive pentru securitate
-- ============================================================================

-- === 1. VERIFICARE EXISTENȚĂ TABEL ===
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'neuron_assets') THEN
    RAISE EXCEPTION 'Tabelul neuron_assets nu există. Rulați mai întâi schema principală.';
  END IF;
END $$;

-- === 2. FUNCȚII UTILITARE PENTRU VALIDARE ===

-- Funcție pentru verificarea dacă un neuron este publicat
CREATE OR REPLACE FUNCTION f_is_neuron_published(p_neuron_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.neurons 
    WHERE id = p_neuron_id AND published = true
  );
$$;

-- Funcție pentru verificarea dacă un asset este de tip public (preview)
CREATE OR REPLACE FUNCTION f_is_public_asset(p_kind text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_kind IN ('cover', 'gallery', 'thumb');
$$;

-- === 3. POLITICI RLS EXISTENTE (dacă există) ===

-- Dezactivează temporar RLS pentru a putea modifica politicile
ALTER TABLE public.neuron_assets DISABLE ROW LEVEL SECURITY;

-- Șterge politicile existente dacă există
DROP POLICY IF EXISTS na_public_preview_anon ON public.neuron_assets;
DROP POLICY IF EXISTS na_public_preview_auth ON public.neuron_assets;
DROP POLICY IF EXISTS na_gated_download_auth ON public.neuron_assets;
DROP POLICY IF EXISTS na_admin_all ON public.neuron_assets;
DROP POLICY IF EXISTS na_asset_validation ON public.neuron_assets;

-- === 4. POLITICI RLS NOI CU VALIDARE ASSET-01 ===

-- 1) Politică pentru utilizatori anonimi - doar assets publice de la neuroni publicați
CREATE POLICY na_public_preview_anon
ON public.neuron_assets FOR SELECT
TO anon
USING (
  f_is_public_asset(kind) 
  AND f_is_neuron_published(neuron_id)
);

-- 2) Politică pentru utilizatori autentificați - preview + download cu verificare acces
CREATE POLICY na_public_preview_auth
ON public.neuron_assets FOR SELECT
TO authenticated
USING (
  f_is_public_asset(kind) 
  AND f_is_neuron_published(neuron_id)
);

-- 3) Politică pentru download-uri gated - doar pentru utilizatori cu acces complet
CREATE POLICY na_gated_download_auth
ON public.neuron_assets FOR SELECT
TO authenticated
USING (
  NOT f_is_public_asset(kind)  -- attachment, inline
  AND f_is_neuron_published(neuron_id)  -- neuronul trebuie să fie publicat
  AND public.f_has_full_access(auth.uid(), neuron_id)  -- verificare acces complet
);

-- 4) Politică pentru admini - acces complet la toate assets
CREATE POLICY na_admin_all
ON public.neuron_assets FOR ALL
TO authenticated
USING (public.f_is_admin())
WITH CHECK (public.f_is_admin());

-- === 5. REACTIVARE RLS ===

ALTER TABLE public.neuron_assets ENABLE ROW LEVEL SECURITY;

-- === 6. VERIFICĂRI DE SECURITATE ===

-- Verifică că RLS este activ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'neuron_assets' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS nu este activ pe neuron_assets';
  END IF;
END $$;

-- Verifică că politicile sunt create
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'neuron_assets' 
    AND policyname = 'na_public_preview_anon'
  ) THEN
    RAISE EXCEPTION 'Politica na_public_preview_anon nu a fost creată';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'neuron_assets' 
    AND policyname = 'na_public_preview_auth'
  ) THEN
    RAISE EXCEPTION 'Politica na_public_preview_auth nu a fost creată';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'neuron_assets' 
    AND policyname = 'na_gated_download_auth'
  ) THEN
    RAISE EXCEPTION 'Politica na_gated_download_auth nu a fost creată';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'neuron_assets' 
    AND policyname = 'na_admin_all'
  ) THEN
    RAISE EXCEPTION 'Politica na_admin_all nu a fost creată';
  END IF;
END $$;

-- === 7. FUNCȚII RPC PENTRU ACCES CONTROLAT ===

-- RPC pentru listarea asset-urilor publice (preview) ale unui neuron
CREATE OR REPLACE FUNCTION rpc_list_neuron_preview_assets(p_neuron_id uuid)
RETURNS TABLE(
  id uuid,
  kind text,
  storage_path text,
  mime_type text,
  width int,
  height int,
  title text,
  alt_text text,
  position int
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    na.id,
    na.kind,
    na.storage_path,
    na.mime_type,
    na.width,
    na.height,
    na.title,
    na.alt_text,
    na.position
  FROM public.neuron_assets na
  WHERE na.neuron_id = p_neuron_id
    AND f_is_public_asset(na.kind)
    AND f_is_neuron_published(na.neuron_id)
  ORDER BY na.kind, na.position, na.id;
$$;

-- RPC pentru obținerea unui asset pentru download (cu verificare acces)
CREATE OR REPLACE FUNCTION rpc_get_neuron_asset_download(p_asset_id uuid)
RETURNS TABLE(
  storage_bucket text,
  storage_path text,
  mime_type text,
  file_size bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_neuron_id uuid;
  v_kind text;
BEGIN
  -- Obține informațiile despre asset
  SELECT neuron_id, kind INTO v_neuron_id, v_kind
  FROM public.neuron_assets
  WHERE id = p_asset_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;
  
  -- Verifică că neuronul este publicat
  IF NOT f_is_neuron_published(v_neuron_id) THEN
    RAISE EXCEPTION 'Neuron not published';
  END IF;
  
  -- Verifică că asset-ul nu este de tip public (preview)
  IF f_is_public_asset(v_kind) THEN
    RAISE EXCEPTION 'Cannot download preview assets';
  END IF;
  
  -- Verifică accesul utilizatorului (dacă este autentificat)
  IF auth.uid() IS NOT NULL THEN
    IF NOT public.f_has_full_access(auth.uid(), v_neuron_id) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  ELSE
    RAISE EXCEPTION 'Authentication required for downloads';
  END IF;
  
  -- Returnează informațiile despre asset
  RETURN QUERY
  SELECT 
    na.storage_bucket,
    na.storage_path,
    na.mime_type,
    na.file_size
  FROM public.neuron_assets na
  WHERE na.id = p_asset_id;
END;
$$;

-- === 8. GRANTURI PENTRU FUNCȚII ===

-- Grant pentru funcția de preview (accesibil public)
GRANT EXECUTE ON FUNCTION rpc_list_neuron_preview_assets(uuid) TO anon, authenticated;

-- Grant pentru funcția de download (doar utilizatori autentificați)
GRANT EXECUTE ON FUNCTION rpc_get_neuron_asset_download(uuid) TO authenticated;

-- === 9. VERIFICARE FINALĂ ===

-- Verifică că toate politicile sunt active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'neuron_assets'
ORDER BY policyname;

-- Mesaj de confirmare
DO $$
BEGIN
  RAISE NOTICE 'ASSET-01 validation policies implemented successfully';
  RAISE NOTICE 'neuron_assets access now requires neurons.published=true';
  RAISE NOTICE 'RLS is active with 4 policies';
END $$;
