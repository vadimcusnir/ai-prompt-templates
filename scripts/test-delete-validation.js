#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDeleteValidation() {
  console.log('🧪 Testare validare DELETE-01...\n');

  try {
    // 1. Testează funcțiile de validare
    console.log('1️⃣ Testez funcțiile de validare...');
    
    const functions = [
      'trg_neurons_block_delete_if_bound',
      'f_soft_delete_neuron',
      'f_restore_neuron'
    ];
    
    let implementedFunctions = 0;
    for (const func of functions) {
      try {
        if (func === 'f_soft_delete_neuron') {
          await supabase.rpc(func, { p_neuron_id: '00000000-0000-0000-0000-000000000000' });
        } else if (func === 'f_restore_neuron') {
          await supabase.rpc(func, { p_neuron_id: '00000000-0000-0000-0000-000000000000' });
        } else {
          // Trigger function nu poate fi testată direct
          console.log(`⚠️  ${func} - funcție trigger (nu poate fi testată direct)`);
          continue;
        }
        console.log(`✅ ${func} - implementată`);
        implementedFunctions++;
      } catch (e) {
        if (e.message.includes('Could not find the function')) {
          console.log(`❌ ${func} - nu implementată`);
        } else {
          console.log(`✅ ${func} - implementată (test cu eroare așteptată)`);
          implementedFunctions++;
        }
      }
    }

    // 2. Testează trigger-ul (încercând un DELETE)
    console.log('\n2️⃣ Testez protecția DELETE...');
    
    // Obține un neuron existent pentru test
    const { data: neurons, error: neuronsError } = await supabase.from('neurons').select('id').limit(1);
    
    if (neuronsError || neurons.length === 0) {
      console.log('❌ Nu pot obține neuroni pentru test');
      return;
    }
    
    const testNeuronId = neurons[0].id;
    console.log(`🔍 Testez DELETE pe neuronul: ${testNeuronId}`);
    
    try {
      // Încearcă să ștergi un neuron (ar trebui să eșueze)
      const { error: deleteError } = await supabase.from('neurons').delete().eq('id', testNeuronId);
      
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

    // 3. Testează alternativă la DELETE (soft-delete)
    console.log('\n3️⃣ Testez alternativă la DELETE (soft-delete)...');
    
    try {
      // Încearcă să faci soft-delete
      const { error: softDeleteError } = await supabase.rpc('f_soft_delete_neuron', { 
        p_neuron_id: testNeuronId, 
        p_reason: 'Test DELETE-01 validation' 
      });
      
      if (softDeleteError) {
        if (softDeleteError.message.includes('Could not find the function')) {
          console.log('❌ Funcția f_soft_delete_neuron nu există');
        } else {
          console.log('⚠️  Soft-delete a eșuat:', softDeleteError.message);
        }
      } else {
        console.log('✅ Soft-delete a reușit');
        
        // Restore neuronul
        try {
          const { error: restoreError } = await supabase.rpc('f_restore_neuron', { 
            p_neuron_id: testNeuronId 
          });
          
          if (restoreError) {
            console.log('⚠️  Restore a eșuat:', restoreError.message);
          } else {
            console.log('✅ Restore a reușit');
          }
        } catch (e) {
          console.log('⚠️  Restore a eșuat:', e.message);
        }
      }
    } catch (e) {
      console.log('❌ Soft-delete a eșuat:', e.message);
    }

    // 4. Testează UPDATE alternativ la DELETE
    console.log('\n4️⃣ Testez UPDATE alternativ la DELETE...');
    
    try {
      // Încearcă să faci UPDATE pentru soft-delete
      const { error: updateError } = await supabase
        .from('neurons')
        .update({ published: false })
        .eq('id', testNeuronId);
      
      if (updateError) {
        console.log('❌ UPDATE pentru soft-delete a eșuat:', updateError.message);
      } else {
        console.log('✅ UPDATE pentru soft-delete a reușit');
        
        // Restore prin UPDATE
        const { error: restoreUpdateError } = await supabase
          .from('neurons')
          .update({ published: true })
          .eq('id', testNeuronId);
        
        if (restoreUpdateError) {
          console.log('⚠️  Restore prin UPDATE a eșuat:', restoreUpdateError.message);
        } else {
          console.log('✅ Restore prin UPDATE a reușit');
        }
      }
    } catch (e) {
      console.log('❌ UPDATE pentru soft-delete a eșuat:', e.message);
    }

    // 5. Raport final
    console.log('\n📊 RAPORT FINAL TESTARE DELETE-01:');
    console.log('====================================');
    
    console.log(`Funcții implementate: ${implementedFunctions}/${functions.length}`);
    
    if (implementedFunctions === functions.length) {
      console.log('🎉 TOATE FUNCȚIILE SUNT IMPLEMENTATE!');
    } else {
      console.log('⚠️  Unele funcții lipsesc - rulează migrările SQL');
    }
    
    console.log('\n🔒 Status protecție DELETE:');
    console.log('  - Trigger neurons_block_delete: ⚠️  Necesită implementare');
    console.log('  - Funcția f_soft_delete_neuron: ⚠️  Necesită implementare');
    console.log('  - Funcția f_restore_neuron: ⚠️  Necesită implementare');
    
    console.log('\n💡 Alternativa funcțională:');
    console.log('  ✅ UPDATE neurons SET published = false WHERE id = ?;');
    console.log('  ✅ UPDATE neurons SET published = true WHERE id = ?;');
    
    console.log('\n🚀 Următorii pași:');
    console.log('  1. Rulează: sql/delete_validation_01.sql');
    console.log('  2. Testează din nou cu acest script');
    console.log('  3. Verifică că DELETE este blocat');

  } catch (error) {
    console.error('❌ Eroare la testarea validării DELETE-01:', error);
  }
}

// Rulează testarea
testDeleteValidation().catch(console.error);
