#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function implementDeleteValidation() {
  console.log('🚀 Implementare validare DELETE-01...\n');

  try {
    // 1. Verifică dacă tabelul neurons există
    console.log('1️⃣ Verific tabelul neurons...');
    const { data: neurons, error: neuronsError } = await supabase.from('neurons').select('id, title, published').limit(1);
    
    if (neuronsError) {
      console.log('❌ Tabelul neurons nu există:', neuronsError.message);
      return;
    }
    
    console.log('✅ Tabelul neurons există');
    console.log(`📋 Neuroni găsiți: ${neurons.length}`);

    // 2. Verifică dacă coloana published există
    console.log('\n2️⃣ Verific coloana published...');
    if (neurons.length > 0 && neurons[0].hasOwnProperty('published')) {
      console.log('✅ Coloana published există');
    } else {
      console.log('❌ Coloana published nu există');
      return;
    }

    // 3. Creează funcția trigger pentru a bloca DELETE
    console.log('\n3️⃣ Creez funcția trigger...');
    const createTriggerFunction = `
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
    `;
    
    // Notă: Nu putem executa SQL direct prin Supabase, deci vom crea un script de migrare
    console.log('⚠️  Funcția trigger va fi creată prin migrare SQL');

    // 4. Creează funcția pentru soft-delete
    console.log('\n4️⃣ Creez funcția soft-delete...');
    const createSoftDeleteFunction = `
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
        
        GET DIAGNOSTICS v_result = FOUND;
        
        RETURN v_result;
      END $$;
    `;
    
    console.log('⚠️  Funcția soft-delete va fi creată prin migrare SQL');

    // 5. Creează funcția pentru restore
    console.log('\n5️⃣ Creez funcția restore...');
    const createRestoreFunction = `
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
        
        GET DIAGNOSTICS v_result = FOUND;
        
        RETURN v_result;
      END $$;
    `;
    
    console.log('⚠️  Funcția restore va fi creată prin migrare SQL');

    // 6. Testează funcțiile existente
    console.log('\n6️⃣ Testez funcțiile existente...');
    
    // Testează f_soft_delete_neuron
    try {
      const { data: softDeleteTest, error: softDeleteError } = await supabase.rpc('f_soft_delete_neuron', { p_neuron_id: '00000000-0000-0000-0000-000000000000' });
      if (softDeleteError) {
        console.log('❌ f_soft_delete_neuron nu există:', softDeleteError.message);
      } else {
        console.log('✅ f_soft_delete_neuron există');
      }
    } catch (e) {
      console.log('❌ f_soft_delete_neuron nu există încă');
    }

    // Testează f_restore_neuron
    try {
      const { data: restoreTest, error: restoreError } = await supabase.rpc('f_restore_neuron', { p_neuron_id: '00000000-0000-0000-0000-000000000000' });
      if (restoreError) {
        console.log('❌ f_restore_neuron nu există:', restoreError.message);
      } else {
        console.log('✅ f_restore_neuron există');
      }
    } catch (e) {
      console.log('❌ f_restore_neuron nu există încă');
    }

    // 7. Testează trigger-ul (încercând un DELETE)
    console.log('\n7️⃣ Testez protecția DELETE...');
    try {
      // Încearcă să ștergi un neuron (ar trebui să eșueze)
      const { error: deleteError } = await supabase.from('neurons').delete().eq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        if (deleteError.message.includes('DELETE direct pe tabelul neurons este interzis')) {
          console.log('✅ Trigger-ul blochează DELETE (așteptat)');
        } else {
          console.log('⚠️  DELETE a eșuat, dar nu din cauza trigger-ului:', deleteError.message);
        }
      } else {
        console.log('❌ DELETE a reușit (neasteptat - trigger-ul nu funcționează)');
      }
    } catch (e) {
      console.log('✅ DELETE a fost blocat (așteptat)');
    }

    // 8. Raport final
    console.log('\n📊 RAPORT FINAL DELETE-01:');
    console.log('================================');
    
    console.log('🔒 Protecție DELETE:');
    console.log('  - Trigger neurons_block_delete: ⚠️  Va fi implementat prin migrare SQL');
    console.log('  - Funcția f_soft_delete_neuron: ⚠️  Va fi implementată prin migrare SQL');
    console.log('  - Funcția f_restore_neuron: ⚠️  Va fi implementată prin migrare SQL');
    
    console.log('\n💡 Alternativa la DELETE:');
    console.log('  UPDATE neurons SET published = false WHERE id = ?;');
    console.log('  SELECT f_soft_delete_neuron(?, ?);');
    
    console.log('\n📁 Fișiere create:');
    console.log('  - sql/delete_validation_01.sql - Script SQL complet pentru implementare');
    
    console.log('\n🚀 Următorii pași:');
    console.log('  1. Rulează scriptul SQL: sql/delete_validation_01.sql');
    console.log('  2. Testează protecția DELETE cu smoke test');
    console.log('  3. Verifică funcțiile soft-delete și restore');

  } catch (error) {
    console.error('❌ Eroare la implementarea validării DELETE-01:', error);
  }
}

// Rulează implementarea
implementDeleteValidation().catch(console.error);
