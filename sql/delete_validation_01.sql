-- DELETE-01: Validare Ștergere
-- Interzice DELETE direct pe tabelul neurons
-- Forțează folosirea UPDATE ... SET published=false
-- Triggerele blochează ștergerea cu obligații

-- 1. Verifică dacă tabelul neurons există
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'neurons') THEN
    RAISE EXCEPTION 'Tabelul neurons nu există. Rulează mai întâi schema completă.';
  END IF;
END $$;

-- 2. Verifică dacă coloana published există
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'neurons' AND column_name = 'published') THEN
    RAISE EXCEPTION 'Coloana published nu există în tabelul neurons. Rulează mai întâi schema completă.';
  END IF;
END $$;

-- 3. Creează funcția trigger pentru a bloca DELETE pe neurons
CREATE OR REPLACE FUNCTION public.trg_neurons_block_delete_if_bound()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text;
  v_alternatives text;
BEGIN
  -- Blochează orice DELETE pe neurons
  v_reason := 'DELETE direct pe tabelul neurons este interzis conform DELETE-01.';
  v_alternatives := 'Folosește UPDATE neurons SET published = false WHERE id = %s;';
  
  RAISE EXCEPTION '% %', v_reason, format(v_alternatives, OLD.id);
  
  RETURN OLD;
END $$;

-- 4. Creează trigger-ul care blochează DELETE
DROP TRIGGER IF EXISTS neurons_block_delete ON public.neurons;
CREATE TRIGGER neurons_block_delete
  BEFORE DELETE ON public.neurons
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_neurons_block_delete_if_bound();

-- 5. Creează funcția pentru soft-delete (alternativa la DELETE)
CREATE OR REPLACE FUNCTION public.f_soft_delete_neuron(p_neuron_id uuid, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result boolean;
BEGIN
  -- Verifică dacă neuronul există
  IF NOT EXISTS (SELECT 1 FROM public.neurons WHERE id = p_neuron_id) THEN
    RAISE EXCEPTION 'Neuronul cu ID % nu există', p_neuron_id;
  END IF;
  
  -- Obține user ID-ul curent
  v_user_id := auth.uid();
  
  -- Soft-delete prin setarea published = false
  UPDATE public.neurons 
  SET 
    published = false,
    updated_at = now()
  WHERE id = p_neuron_id;
  
  -- Returnează true dacă UPDATE-ul a afectat cel puțin un rând
  RETURN FOUND;
END $$;

-- 6. Creează funcția pentru restore (opusul soft-delete)
CREATE OR REPLACE FUNCTION public.f_restore_neuron(p_neuron_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result boolean;
BEGIN
  -- Verifică dacă neuronul există
  IF NOT EXISTS (SELECT 1 FROM public.neurons WHERE id = p_neuron_id) THEN
    RAISE EXCEPTION 'Neuronul cu ID % nu există', p_neuron_id;
  END IF;
  
  -- Obține user ID-ul curent
  v_user_id := auth.uid();
  
  -- Restore prin setarea published = true
  UPDATE public.neurons 
  SET 
    published = true,
    updated_at = now()
  WHERE id = p_neuron_id;
  
  -- Returnează true dacă UPDATE-ul a afectat cel puțin un rând
  RETURN FOUND;
END $$;

-- 7. Creează tabelul audit_log dacă nu există
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  old_values jsonb,
  new_values jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Creează indexuri pentru audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON public.audit_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- 9. RLS pentru audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policy pentru audit_log (doar admin și user-ul care a făcut acțiunea)
CREATE POLICY audit_log_admin_access ON public.audit_log
  FOR ALL TO authenticated
  USING (
    public.f_is_admin_current_user() OR 
    user_id = auth.uid()
  );

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION public.f_soft_delete_neuron(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_restore_neuron(uuid) TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;

-- 11. Testează trigger-ul
SELECT 'Testing DELETE-01 validation...' AS status;

-- Verifică dacă trigger-ul există
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'neurons'
  AND trigger_name = 'neurons_block_delete';

-- Verifică funcțiile create
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('trg_neurons_block_delete_if_bound', 'f_soft_delete_neuron', 'f_restore_neuron');

-- 12. Raport final
SELECT 
  'VALIDARE COMPLETĂ DELETE-01' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
        AND event_object_table = 'neurons'
        AND trigger_name = 'neurons_block_delete'
    ) THEN '✅ TRIGGER DELETE BLOCHAT IMPLEMENTAT'
    ELSE '❌ TRIGGER DELETE NU ESTE IMPLEMENTAT'
  END AS trigger_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'f_soft_delete_neuron'
    ) THEN '✅ FUNCȚIE SOFT-DELETE IMPLEMENTATĂ'
    ELSE '❌ FUNCȚIE SOFT-DELETE NU ESTE IMPLEMENTATĂ'
  END AS soft_delete_status;
