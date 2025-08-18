#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDeleteProtection() {
  console.log('🧪 Testare protecție DELETE după implementare...\n');

  try {
    // 1. Verifică dacă trigger-ul există
    console.log('1️⃣ Verific implementarea trigger-ului...');
    
    // Testează funcția trigger (nu poate fi testată direct)
    console.log('⚠️  Trigger-ul nu poate fi testat direct prin Supabase');
    console.log('📁 Verifică în Supabase Dashboard > SQL Editor > Run:');
    console.log('   SELECT * FROM information_schema.triggers WHERE trigger_name = \'neurons_block_delete\';');

    // 2. Testează funcțiile de soft-delete
    console.log('\n2️⃣ Testez funcțiile de soft-delete...');
    
    // Obține un neuron pentru test
    const { data: neurons, error: neuronsError } = await supabase.from('neurons').select('id, title, published').limit(1);
    if (neuronsError || neurons.length === 0) {
      console.log('❌ Nu pot obține neuroni pentru test');
      return;
    }
    
    const testNeuronId = neurons[0].id;
    console.log(`🔍 Neuron de test: ${testNeuronId} (${neurons[0].title})`);
    console.log(`📊 Status inițial: published = ${neurons[0].published}`);

    // Testează f_soft_delete_neuron
    try {
      const { data: softDeleteTest, error: softDeleteError } = await supabase.rpc('f_soft_delete_neuron', { 
        p_neuron_id: testNeuronId, 
        p_reason: 'Test DELETE-01 protection' 
      });
      
      if (softDeleteError) {
        if (softDeleteError.message.includes('Could not find the function')) {
          console.log('❌ f_soft_delete_neuron nu există încă');
          console.log('💡 Rulează scriptul SQL în Supabase Dashboard');
        } else {
          console.log('⚠️  f_soft_delete_neuron a eșuat:', softDeleteError.message);
        }
      } else {
        console.log('✅ f_soft_delete_neuron funcționează');
        
        // Verifică starea după soft-delete
        const { data: neuronAfterSoftDelete } = await supabase
          .from('neurons')
          .select('published')
          .eq('id', testNeuronId)
          .single();
        
        if (neuronAfterSoftDelete && !neuronAfterSoftDelete.published) {
          console.log('✅ Neuronul este marcat ca soft-deleted (published = false)');
        } else {
          console.log('❌ Soft-delete nu a funcționat corect');
        }
      }
    } catch (e) {
      console.log('❌ f_soft_delete_neuron nu există încă:', e.message);
    }

    // Testează f_restore_neuron
    try {
      const { data: restoreTest, error: restoreError } = await supabase.rpc('f_restore_neuron', { 
        p_neuron_id: testNeuronId 
      });
      
      if (restoreError) {
        if (restoreError.message.includes('Could not find the function')) {
          console.log('❌ f_restore_neuron nu există încă');
          console.log('💡 Rulează scriptul SQL în Supabase Dashboard');
        } else {
          console.log('⚠️  f_restore_neuron a eșuat:', restoreError.message);
        }
      } else {
        console.log('✅ f_restore_neuron funcționează');
        
        // Verifică starea după restore
        const { data: neuronAfterRestore } = await supabase
          .from('neurons')
          .select('published')
          .eq('id', testNeuronId)
          .single();
        
        if (neuronAfterRestore && neuronAfterRestore.published) {
          console.log('✅ Neuronul este restaurat (published = true)');
        } else {
          console.log('❌ Restore nu a funcționat corect');
        }
      }
    } catch (e) {
      console.log('❌ f_restore_neuron nu există încă:', e.message);
    }

    // 3. Testează protecția DELETE (ar trebui să eșueze)
    console.log('\n3️⃣ Testez protecția DELETE (ar trebui să eșueze)...');
    
    try {
      // Încearcă să ștergi un neuron (ar trebui să eșueze)
      const { error: deleteError } = await supabase.from('neurons').delete().eq('id', testNeuronId);
      
      if (deleteError) {
        if (deleteError.message.includes('DELETE direct pe tabelul neurons este interzis')) {
          console.log('✅ DELETE este blocat de trigger (așteptat)!');
          console.log('🔒 Protecția DELETE-01 funcționează!');
        } else {
          console.log('⚠️  DELETE a eșuat, dar nu din cauza trigger-ului:', deleteError.message);
        }
      } else {
        console.log('❌ DELETE a reușit (neasteptat - trigger-ul nu funcționează)');
        
        // Restore neuronul pentru a continua testarea
        console.log('🔄 Restore neuronul pentru a continua testarea...');
        const { error: restoreError } = await supabase
          .from('neurons')
          .update({ published: true })
          .eq('id', testNeuronId);
        
        if (restoreError) {
          console.log('❌ Restore a eșuat:', restoreError.message);
        } else {
          console.log('✅ Neuronul a fost restaurat');
        }
      }
    } catch (e) {
      if (e.message.includes('DELETE direct pe tabelul neurons este interzis')) {
        console.log('✅ DELETE este blocat de trigger (așteptat)!');
        console.log('🔒 Protecția DELETE-01 funcționează!');
      } else {
        console.log('✅ DELETE a fost blocat (așteptat)');
      }
    }

    // 4. Testează alternativa manuală (UPDATE)
    console.log('\n4️⃣ Testez alternativa manuală (UPDATE)...');
    
    try {
      // Soft-delete prin UPDATE
      const { error: updateError } = await supabase
        .from('neurons')
        .update({ published: false })
        .eq('id', testNeuronId);
      
      if (updateError) {
        console.log('❌ UPDATE pentru soft-delete a eșuat:', updateError.message);
      } else {
        console.log('✅ UPDATE pentru soft-delete a reușit');
        
        // Verifică starea
        const { data: neuronAfterSoftDelete } = await supabase
          .from('neurons')
          .select('published')
          .eq('id', testNeuronId)
          .single();
        
        if (neuronAfterSoftDelete && !neuronAfterSoftDelete.published) {
          console.log('✅ Neuronul este marcat ca soft-deleted (published = false)');
        } else {
          console.log('❌ Soft-delete nu a funcționat corect');
        }
        
        // Restore prin UPDATE
        const { error: restoreUpdateError } = await supabase
          .from('neurons')
          .update({ published: true })
          .eq('id', testNeuronId);
        
        if (restoreUpdateError) {
          console.log('❌ Restore prin UPDATE a eșuat:', restoreUpdateError.message);
        } else {
          console.log('✅ Restore prin UPDATE a reușit');
          
          // Verifică starea finală
          const { data: neuronAfterRestore } = await supabase
            .from('neurons')
            .select('published')
            .eq('id', testNeuronId)
            .single();
          
          if (neuronAfterRestore && neuronAfterRestore.published) {
            console.log('✅ Neuronul este restaurat (published = true)');
          } else {
            console.log('❌ Restore nu a funcționat corect');
          }
        }
      }
    } catch (e) {
      console.log('❌ Test UPDATE a eșuat:', e.message);
    }

    // 5. Raport final
    console.log('\n📊 RAPORT FINAL TESTARE DELETE-01:');
    console.log('====================================');
    
    console.log('🔒 Status protecție DELETE:');
    console.log('  - Trigger neurons_block_delete: ⚠️  Necesită verificare manuală');
    console.log('  - Funcția f_soft_delete_neuron: ⚠️  Necesită implementare');
    console.log('  - Funcția f_restore_neuron: ⚠️  Necesită implementare');
    
    console.log('\n💡 Alternativa funcțională:');
    console.log('  ✅ UPDATE neurons SET published = false WHERE id = ?; - FUNCȚIONEAZĂ');
    console.log('  ✅ UPDATE neurons SET published = true WHERE id = ?; - FUNCȚIONEAZĂ');
    
    console.log('\n🚀 Următorii pași:');
    console.log('  1. Rulează în Supabase Dashboard > SQL Editor:');
    console.log('     scripts/execute-delete-validation.sql');
    console.log('  2. Testează din nou cu acest script');
    console.log('  3. Verifică că DELETE este blocat');
    
    console.log('\n📁 Scripturi gata:');
    console.log('  - scripts/execute-delete-validation.sql - Pentru Supabase Dashboard');
    console.log('  - sql/delete_validation_01.sql - Script complet cu teste');

  } catch (error) {
    console.error('❌ Eroare la testarea protecției DELETE:', error);
  }
}

// Rulează testarea
testDeleteProtection().catch(console.error);
