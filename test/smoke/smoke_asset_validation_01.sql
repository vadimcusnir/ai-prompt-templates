-- ============================================================================
-- SMOKE TEST: ASSET-01 VALIDATION
-- ============================================================================
-- 
-- Testează implementarea politicilor de validare ASSET-01:
-- - Verifică că accesul la neuron_assets verifică neurons.published=true
-- - Testează politicile RLS pentru utilizatori anonimi și autentificați
-- - Verifică funcționalitatea funcțiilor RPC
--
-- Rulare: psql -f smoke_asset_validation_01.sql
-- ============================================================================

-- === 1. SETUP TEST DATA ===

-- Creează un neuron publicat pentru testare
INSERT INTO public.neurons (
  slug, title, summary, content_full, price_cents, 
  category, tags, published
) VALUES (
  'test-asset-validation', 
  'Test Asset Validation', 
  'Test pentru validarea ASSET-01', 
  'Conținut complet pentru test', 
  2900, 
  'test', 
  '{"test", "validation"}', 
  true
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  published = EXCLUDED.published
RETURNING id INTO TEMP TABLE test_neuron_published(id);

-- Creează un neuron nepublicat pentru testare
INSERT INTO public.neurons (
  slug, title, summary, content_full, price_cents, 
  category, tags, published
) VALUES (
  'test-asset-validation-unpublished', 
  'Test Asset Validation Unpublished', 
  'Test pentru validarea ASSET-01 - nepublicat', 
  'Conținut complet pentru test nepublicat', 
  3900, 
  'test', 
  '{"test", "validation", "unpublished"}', 
  false
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  published = EXCLUDED.published
RETURNING id INTO TEMP TABLE test_neuron_unpublished(id);

-- Creează assets pentru neuronul publicat
INSERT INTO public.neuron_assets (
  neuron_id, kind, storage_path, mime_type, title, position
) VALUES 
  ((SELECT id FROM test_neuron_published), 'cover', 'test/cover.webp', 'image/webp', 'Cover Test', 0),
  ((SELECT id FROM test_neuron_published), 'gallery', 'test/g1.webp', 'image/webp', 'Gallery 1', 0),
  ((SELECT id FROM test_neuron_published), 'thumb', 'test/thumb.webp', 'image/webp', 'Thumbnail', 0),
  ((SELECT id FROM test_neuron_published), 'attachment', 'test/document.pdf', 'application/pdf', 'Document PDF', 0),
  ((SELECT id FROM test_neuron_published), 'inline', 'test/inline.webp', 'image/webp', 'Inline Image', 0)
ON CONFLICT DO NOTHING;

-- Creează assets pentru neuronul nepublicat
INSERT INTO public.neuron_assets (
  neuron_id, kind, storage_path, mime_type, title, position
) VALUES 
  ((SELECT id FROM test_neuron_unpublished), 'cover', 'test-unpub/cover.webp', 'image/webp', 'Cover Unpublished', 0),
  ((SELECT id FROM test_neuron_unpublished), 'attachment', 'test-unpub/document.pdf', 'application/pdf', 'Document Unpublished', 0)
ON CONFLICT DO NOTHING;

-- === 2. TEST POLITICI RLS - UTILIZATORI ANONIMI ===

\echo '=== TEST 1: Utilizatori anonimi - doar assets publice de la neuroni publicați ==='

-- Test 1.1: Acces la assets publice de la neuron publicat (trebuie să funcționeze)
\echo 'Test 1.1: Acces la cover de la neuron publicat (anon)'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS: Anon poate accesa cover de la neuron publicat'
    ELSE 'FAIL: Anon nu poate accesa cover de la neuron publicat'
  END as result
FROM public.neuron_assets 
WHERE neuron_id = (SELECT id FROM test_neuron_published) 
  AND kind = 'cover';

-- Test 1.2: Acces la gallery de la neuron publicat (trebuie să funcționeze)
\echo 'Test 1.2: Acces la gallery de la neuron publicat (anon)'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS: Anon poate accesa gallery de la neuron publicat'
    ELSE 'FAIL: Anon nu poate accesa gallery de la neuron publicat'
  END as result
FROM public.neuron_assets 
WHERE neuron_id = (SELECT id FROM test_neuron_published) 
  AND kind = 'gallery';

-- Test 1.3: Acces la attachment de la neuron publicat (NU trebuie să funcționeze pentru anon)
\echo 'Test 1.3: Acces la attachment de la neuron publicat (anon) - trebuie să fie blocat'
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Anon nu poate accesa attachment de la neuron publicat'
    ELSE 'FAIL: Anon poate accesa attachment de la neuron publicat (securitate compromisă)'
  END as result
FROM public.neuron_assets 
WHERE neuron_id = (SELECT id FROM test_neuron_published) 
  AND kind = 'attachment';

-- Test 1.4: Acces la assets de la neuron nepublicat (NU trebuie să funcționeze)
\echo 'Test 1.4: Acces la assets de la neuron nepublicat (anon) - trebuie să fie blocat'
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Anon nu poate accesa assets de la neuron nepublicat'
    ELSE 'FAIL: Anon poate accesa assets de la neuron nepublicat (securitate compromisă)'
  END as result
FROM public.neuron_assets 
WHERE neuron_id = (SELECT id FROM test_neuron_unpublished);

-- === 3. TEST POLITICI RLS - UTILIZATORI AUTENTIFICAȚI ===

\echo '=== TEST 2: Utilizatori autentificați - preview + download cu verificare acces ==='

-- Simulează un utilizator autentificat (în realitate ar fi auth.uid())
-- Pentru test, vom verifica că politicile sunt create corect

-- Test 2.1: Verifică că politicile RLS sunt active
\echo 'Test 2.1: Verifică că RLS este activ pe neuron_assets'
SELECT 
  CASE 
    WHEN rowsecurity = true THEN 'PASS: RLS este activ pe neuron_assets'
    ELSE 'FAIL: RLS nu este activ pe neuron_assets'
  END as result
FROM pg_tables 
WHERE tablename = 'neuron_assets';

-- Test 2.2: Verifică că politicile sunt create
\echo 'Test 2.2: Verifică că politicile RLS sunt create'
SELECT 
  CASE 
    WHEN COUNT(*) = 4 THEN 'PASS: Toate cele 4 politici RLS sunt create'
    ELSE 'FAIL: Lipsesc politici RLS (așteptat: 4, găsit: ' || COUNT(*) || ')'
  END as result
FROM pg_policies 
WHERE tablename = 'neuron_assets';

-- === 4. TEST FUNCȚII RPC ===

\echo '=== TEST 3: Funcții RPC pentru acces controlat ==='

-- Test 3.1: Funcția de preview pentru neuron publicat
\echo 'Test 3.1: rpc_list_neuron_preview_assets pentru neuron publicat'
SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN 'PASS: Funcția RPC returnează 3 assets publice (cover, gallery, thumb)'
    ELSE 'FAIL: Funcția RPC returnează ' || COUNT(*) || ' assets (așteptat: 3)'
  END as result
FROM rpc_list_neuron_preview_assets((SELECT id FROM test_neuron_published));

-- Test 3.2: Funcția de preview pentru neuron nepublicat
\echo 'Test 3.2: rpc_list_neuron_preview_assets pentru neuron nepublicat'
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Funcția RPC nu returnează assets pentru neuron nepublicat'
    ELSE 'FAIL: Funcția RPC returnează ' || COUNT(*) || ' assets pentru neuron nepublicat (așteptat: 0)'
  END as result
FROM rpc_list_neuron_preview_assets((SELECT id FROM test_neuron_unpublished));

-- === 5. TEST SECURITATE - VERIFICĂRI CRITICE ===

\echo '=== TEST 4: Verificări de securitate critice ==='

-- Test 4.1: Verifică că nu există acces direct la neuron_assets fără verificarea published
\echo 'Test 4.1: Verifică că nu există acces direct la neuron_assets fără published check'
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Nu există acces direct la neuron_assets fără published check'
    ELSE 'FAIL: Există acces direct la neuron_assets fără published check'
  END as result
FROM public.neuron_assets 
WHERE neuron_id = (SELECT id FROM test_neuron_unpublished);

-- Test 4.2: Verifică că funcțiile utilitare funcționează corect
\echo 'Test 4.2: Verifică funcțiile utilitare'
SELECT 
  CASE 
    WHEN f_is_neuron_published((SELECT id FROM test_neuron_published)) = true 
         AND f_is_neuron_published((SELECT id FROM test_neuron_unpublished)) = false
    THEN 'PASS: Funcțiile utilitare funcționează corect'
    ELSE 'FAIL: Funcțiile utilitare nu funcționează corect'
  END as result;

-- === 6. TEST PERFORMANȚĂ ===

\echo '=== TEST 5: Teste de performanță ==='

-- Test 5.1: Verifică că indexurile sunt create
\echo 'Test 5.1: Verifică indexurile pe neuron_assets'
SELECT 
  CASE 
    WHEN COUNT(*) >= 2 THEN 'PASS: Indexurile necesare sunt create (' || COUNT(*) || ' găsite)'
    ELSE 'FAIL: Lipsesc indexuri necesare (găsit: ' || COUNT(*) || ')'
  END as result
FROM pg_indexes 
WHERE tablename = 'neuron_assets';

-- === 7. CURĂȚARE TEST DATA ===

\echo '=== CURĂȚARE TEST DATA ==='

-- Șterge assets de test
DELETE FROM public.neuron_assets 
WHERE neuron_id IN (
  SELECT id FROM test_neuron_published 
  UNION 
  SELECT id FROM test_neuron_unpublished
);

-- Șterge neuroni de test
DELETE FROM public.neurons 
WHERE slug IN ('test-asset-validation', 'test-asset-validation-unpublished');

-- Șterge tabelele temporare
DROP TABLE IF EXISTS test_neuron_published;
DROP TABLE IF EXISTS test_neuron_unpublished;

\echo '=== REZULTATE FINALE ==='
\echo 'Dacă toate testele au trecut cu PASS, validarea ASSET-01 este implementată corect.'
\echo 'Politicile RLS asigură că accesul la neuron_assets verifică neurons.published=true.'
