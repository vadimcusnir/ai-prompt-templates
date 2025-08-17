-- 27_slug_ci_and_validation.sql
-- Slug Discipline: case-insensitive uniques + validare strictă + aliniere la f_ltree_label()
-- Fixează slug-urile ca identități canonice: unicitate pe lower(slug) pentru neurons și bundles
-- CHECK cu regex; normalizare deterministă; pod către arbore: slug → ltree label compatibil

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === 1. VALIDATOR: regex canonic (lowercase, cuvinte despărțite de minus) ===
-- ^[a-z0-9]+(-[a-z0-9]+)*$
CREATE OR REPLACE FUNCTION public.f_is_valid_slug(s text)
RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT s IS NOT NULL AND s ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
$$;

-- === 2. NORMALIZATOR: 'Any' → 'any', spații/punctuație → '-', compactează '-', taie marginile ===
-- Dacă rezultatul e gol → 'n-' + hash scurt determinist
CREATE OR REPLACE FUNCTION public.f_slugify(src text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  s text := lower(coalesce(src,''));
BEGIN
  s := replace(s, '_', '-');                          -- underscore → minus
  s := regexp_replace(s, '[^a-z0-9-]+', '-', 'g');    -- orice altceva → minus
  s := regexp_replace(s, '-{2,}', '-', 'g');          -- compactează --
  s := regexp_replace(s, '^-+|-+$', '', 'g');         -- taie marginile
  IF s = '' THEN
    s := 'n-' || substr(encode(digest(coalesce(src,''), 'sha1'), 'hex'), 1, 8);
  END IF;
  RETURN s;
END $$;

-- === 3. ALIGN: slug → etichetă de arbore compatibilă cu f_ltree_label() ===
-- (în arbore sunt permise [a-z0-9_]; prefix 'n_' dacă începe cu cifră)
-- Refolosește f_ltree_label() definită în schema arborelui
CREATE OR REPLACE FUNCTION public.f_slug_to_ltree_label(s text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT public.f_ltree_label( replace(public.f_slugify(s), '-', '_') )
$$;

-- === 4. TRIGGERE: normalizează slug la INSERT/UPDATE pentru NEURONS și BUNDLES ===
CREATE OR REPLACE FUNCTION public.trg_normalize_slug_neurons()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.slug := public.f_slugify(NEW.slug);
  IF NOT public.f_is_valid_slug(NEW.slug) THEN
    RAISE EXCEPTION 'Invalid slug format for neuron: %', NEW.slug;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.trg_normalize_slug_bundles()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.slug := public.f_slugify(NEW.slug);
  IF NOT public.f_is_valid_slug(NEW.slug) THEN
    RAISE EXCEPTION 'Invalid slug format for bundle: %', NEW.slug;
  END IF;
  RETURN NEW;
END $$;

-- atașează triggerele (idempotent)
DROP TRIGGER IF EXISTS neurons_normalize_slug ON public.neurons;
CREATE TRIGGER neurons_normalize_slug
BEFORE INSERT OR UPDATE OF slug ON public.neurons
FOR EACH ROW EXECUTE FUNCTION public.trg_normalize_slug_neurons();

DROP TRIGGER IF EXISTS bundles_normalize_slug ON public.bundles;
CREATE TRIGGER bundles_normalize_slug
BEFORE INSERT OR UPDATE OF slug ON public.bundles
FOR EACH ROW EXECUTE FUNCTION public.trg_normalize_slug_bundles();

-- === 5. CHECK constraints pe formatul slug (hard rule) ===
ALTER TABLE public.neurons  DROP CONSTRAINT IF EXISTS ck_neurons_slug_format;
ALTER TABLE public.neurons  ADD  CONSTRAINT ck_neurons_slug_format  CHECK (public.f_is_valid_slug(slug));

ALTER TABLE public.bundles  DROP CONSTRAINT IF EXISTS ck_bundles_slug_format;
ALTER TABLE public.bundles  ADD  CONSTRAINT ck_bundles_slug_format  CHECK (public.f_is_valid_slug(slug));

-- === 6. BACKFILL: normalizează existenții (înaintea indexurilor unice) ===
UPDATE public.neurons  SET slug = public.f_slugify(slug)  WHERE slug IS NOT NULL AND slug <> public.f_slugify(slug);
UPDATE public.bundles  SET slug = public.f_slugify(slug)  WHERE slug IS NOT NULL AND slug <> public.f_slugify(slug);

-- === 7. DE-DUPE după normalizare (dacă apar coliziuni pe lower(slug)) ===
-- sufixelor li se atașează '-'+hash(id) pentru stabilitate
WITH d AS (
  SELECT id, slug, lower(slug) AS lslug,
         ROW_NUMBER() OVER (PARTITION BY lower(slug) ORDER BY id) AS rn
  FROM public.neurons
)
UPDATE public.neurons n
   SET slug = n.slug || '-' || substr(encode(digest(n.id::text, 'sha1'),'hex'),1,6)
  FROM d WHERE n.id = d.id AND d.rn > 1;

WITH d AS (
  SELECT id, slug, lower(slug) AS lslug,
         ROW_NUMBER() OVER (PARTITION BY lower(slug) ORDER BY id) AS rn
  FROM public.bundles
)
UPDATE public.bundles b
   SET slug = b.slug || '-' || substr(encode(digest(b.id::text, 'sha1'),'hex'),1,6)
  FROM d WHERE b.id = d.id AND d.rn > 1;

-- === 8. INDEXURI UNICE case-insensitive ===
-- (păstrează UNIQUE existent pe slug; acesta e case-sensitive și nu strică.
--  indexurile noi previn dubluri 'Test' vs 'test'.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_neurons_slug_ci ON public.neurons (lower(slug));
CREATE UNIQUE INDEX IF NOT EXISTS uq_bundles_slug_ci ON public.bundles (lower(slug));

-- === 9. (OPȚIONAL, recomandat) Istoric sluguri ===
-- dacă ai tabelul neuron_slugs creat în guard-ul legal (§4)
ALTER TABLE IF EXISTS public.neuron_slugs DROP CONSTRAINT IF EXISTS ck_neuron_slugs_slug_format;
ALTER TABLE IF EXISTS public.neuron_slugs ADD  CONSTRAINT ck_neuron_slugs_slug_format CHECK (public.f_is_valid_slug(slug));

CREATE UNIQUE INDEX IF NOT EXISTS uq_neuron_slugs_slug_ci ON public.neuron_slugs (lower(slug));

-- === 10. Interop explicit cu arborele (contract "slug ↔ label") ===

-- Regulă: când ai nevoie de etichetă de arbore pentru un slug, 
-- folosește f_slug_to_ltree_label(slug) — e compatibilă cu f_ltree_label() 
-- (etichetele din arbore sunt [a-z0-9_] și evită începutul cu cifră)

-- exemple rapide
-- SELECT public.f_slugify('AI / Prompt—Engineering! 101')          AS slug;   -- ai-prompt-engineering-101
-- SELECT public.f_slug_to_ltree_label('ai-prompt-engineering-101') AS label;  -- ai_prompt_engineering_101

-- === 11. Smoke-tests (trec/nu trec) ===

-- OK
-- INSERT INTO public.neurons(slug,title,summary,content_full,price_cents,category,tags)
-- VALUES ('ai-frameworks','X','prev','full',2900,'cat','{}');

-- FAIL: invalid (uppercase / caractere ilegale)
-- INSERT INTO public.neurons(slug,title,summary,content_full,price_cents,category,tags)
-- VALUES ('AI Frameworks','X','prev','full',2900,'cat','{}');  -- trigger normalizează → 'ai-frameworks'; dacă deja există → coliziune ci

-- FAIL: dublură case-insensitive
-- INSERT INTO public.bundles(slug,title,description,price_cents,required_tier)
-- VALUES ('Starter-Pack','Y','desc',11900,'architect');        -- eșuează dacă există 'starter-pack' (uq_*_slug_ci)

-- ALIGN cu arbore
-- SELECT public.f_ltree_label('AI Frameworks');                -- ai_frameworks
-- SELECT public.f_slug_to_ltree_label('ai-frameworks');        -- ai_frameworks (identic)

-- === 12. De ce acum (și aici) ===

-- Neuroni și bundles sunt suprafețe publice; slug-ul este identitatea comercială 
-- → închide spațiul pentru dubluri "Test/test" sau forme cu spații/punctuație. 

-- Arborele folosește f_ltree_label() pentru path determinist; 
-- slug → label trebuie să fie o funcție stabilă, nu o convenție informală. 

-- === 13. Verdict simbolic ===

-- Canonicalizează numele — slugul devine lege, nu opinie.
