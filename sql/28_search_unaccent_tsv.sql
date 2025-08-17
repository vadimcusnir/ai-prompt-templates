-- 28_search_unaccent_tsv.sql
-- Search Robust: unaccent + tsvector GENERAT (idempotent, public-safe)
-- Obiectiv: treci de la index pe expresie dinamică la coloană tsv generată & STORED
-- cu unaccent și GIN, apoi expui căutarea printr-un RPC public care respectă vitrina
-- zero risc de leak la content_full

CREATE EXTENSION IF NOT EXISTS unaccent;

-- === 1. Curățare: indexul vechi pe expresie (a fost english; acum e STORED) ===
DROP INDEX IF EXISTS idx_neurons_search;

-- === 2. Coloană GENERATĂ & STORED (accent-insensitive, config 'simple') ===
ALTER TABLE public.neurons
  DROP COLUMN IF EXISTS tsv,
  ADD  COLUMN tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      unaccent(coalesce(title,'') || ' ' || coalesce(summary,''))
    )
  ) STORED;

-- === 3. GIN pe tsv ===
CREATE INDEX IF NOT EXISTS idx_neurons_tsv_gin
  ON public.neurons
  USING GIN (tsv);

-- === 4. (opțional) btree pe created_at pentru tie-break la ordonare ===
CREATE INDEX IF NOT EXISTS idx_neurons_created_at ON public.neurons(created_at DESC);

-- === 5. RPC public pentru căutare — rpc_search_neurons (rank + snippet, fără leak) ===

-- Contract: intrare q text, limit int=20, offset int=0; 
-- întoarce doar câmpurile din vitrină + rank + snippet. 
-- Rulează SECURITY DEFINER, se auto-filtrează prin v_neuron_public (doar published=true)

CREATE OR REPLACE FUNCTION public.rpc_search_neurons(
  p_q text,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  slug text,
  title text,
  summary text,
  required_tier plan_tier,
  price_cents int,
  rank real,
  snippet text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q tsquery := NULL;
BEGIN
  -- normalizează interogarea; respinge zgomotul foarte scurt
  p_q := btrim(coalesce(p_q,''));
  IF length(p_q) < 2 THEN
    RETURN;
  END IF;

  -- compune tsquery: plain → simplu, robust; unaccent pe input
  q := plainto_tsquery('simple', unaccent(p_q));

  RETURN QUERY
  SELECT
    v.id, v.slug, v.title, v.summary, v.required_tier, v.price_cents,
    ts_rank(n.tsv, q) AS rank,
    -- headline pe summary (2 fragmente compacte)
    ts_headline(
      'simple',
      unaccent(v.summary),
      q,
      'MaxFragments=2, MinWords=5, MaxWords=12, HighlightAll=FALSE'
    ) AS snippet
  FROM public.v_neuron_public v
  JOIN public.neurons n ON n.id = v.id   -- asigură published=true prin view
  WHERE n.tsv @@ q
  ORDER BY rank DESC, v.title ASC
  LIMIT greatest(1, coalesce(p_limit,20))
  OFFSET greatest(0, coalesce(p_offset,0));
END
$$;

-- expunere: public (anon + authenticated) — doar view fields
REVOKE ALL ON FUNCTION public.rpc_search_neurons(text,int,int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_search_neurons(text,int,int) TO anon, authenticated;

-- === 6. Exemple de interogare (copy/paste) ===

-- accent-insensitive (căutare "arhitectura" găsește "arhitectură")
-- SELECT slug, title, rank
-- FROM public.rpc_search_neurons('arhitectura', 10, 0);

-- query scurt dar valid (>=2 char)
-- SELECT slug, title, snippet
-- FROM public.rpc_search_neurons('ai', 10, 0);

-- paginare
-- SELECT slug, title
-- FROM public.rpc_search_neurons('prompt systems', 20, 20);

-- === 7. Teste & verificări (sanity) ===

-- 1) ANALYZE pentru planuri sănătoase
-- ANALYZE public.neurons;

-- 2) Verifică folosirea indexului GIN
-- EXPLAIN ANALYZE
-- SELECT id FROM public.neurons
-- WHERE tsv @@ plainto_tsquery('simple', unaccent('arhitectura'));

-- 3) Smoke pe RPC (anon/auth)
-- SELECT count(*) FROM public.rpc_search_neurons('architect', 5, 0);

-- === 8. Hardening opțional (extensii previzibile) ===

-- websearch_to_tsquery pentru operatori "Google-like" ("fraze", A OR B, -excluderi), 
-- dacă vrei query parsing mai bogat: schimbă plainto_tsquery ↔ websearch_to_tsquery (păstrezi unaccent).

-- tags în căutare: extinde tsv la title||summary||array_to_string(tags,' ') 
-- dacă vrei să intri și pe etichete (menții GIN pe aceeași coloană).

-- trigram prefix (pg_trgm) pentru completare instant; ține-l separat de FTS (nu îl amesteca în această migrare).

-- === 9. Integrare frontend (Supabase client; minimal) ===

-- // search.ts
-- import { createClient } from '@supabase/supabase-js';
-- const supabase = createClient(SUPA_URL, SUPA_ANON);
-- 
-- export async function searchNeurons(q: string, limit = 20, offset = 0) {
--   return supabase
--     .rpc('rpc_search_neurons', { p_q: q, p_limit: limit, p_offset: offset });
-- }
-- // UI: afișează title/summary/snippet; nu expune content_full aici.

-- === 10. Roluri și securitate ===

-- Roluri: anon/authenticated pot apela RPC; 
-- conținutul full rămâne exclusiv pe rpc_get_neuron_full (cu rate-limit + watermark). 

-- Back-compat: rutele /search din FE lovesc acum RPC-ul; 
-- rămâi aliniat cu separarea "preview vs full" implementată în schema views/RPC.

-- === 11. Note solide ===

-- Țintești accent-insensitive prin unaccent(...) în coloană generată; 
-- GIN(tsv) devine stabil, spre deosebire de indexul anterior pe expresie. 

-- simple ≈ fără stemming — potrivit mixului RO/EN; 
-- ai preview public doar din v_neuron_public, full prin RPC separat.

-- === 12. Verdict simbolic ===

-- Fă din căutare o decizie, nu o expresie: 
-- tokenizare simplă, accent-insensitivă, index stocat, livrare controlată.
