#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateTestUUIDs() {
  console.log('🔧 GENERARE UUID-URI VALIDE PENTRU TESTARE DELETE-01...\n');

  try {
    // 1. Verifică tabelele disponibile
    console.log('1️⃣ Verific tabelele disponibile...');
    
    const tables = ['neurons', 'plans', 'user_subscriptions'];
    const availableTables = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (!error && data.length > 0) {
          availableTables.push({ name: table, count: data.length, sampleId: data[0].id });
        }
      } catch (e) {
        // Tabelul nu există sau nu este accesibil
      }
    }
    
    if (availableTables.length === 0) {
      console.log('❌ Nu am găsit tabele cu date pentru testare');
      return;
    }
    
    console.log('✅ Tabele disponibile pentru testare:');
    availableTables.forEach(table => {
      console.log(`  - ${table.name}: ${table.count} rânduri, ID sample: ${table.sampleId}`);
    });

    // 2. Generează UUID-uri valide pentru testare
    console.log('\n2️⃣ Generez UUID-uri valide pentru testare...');
    
    const testUUIDs = [];
    for (let i = 0; i < 5; i++) {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      testUUIDs.push(uuid);
    }
    
    console.log('✅ UUID-uri generate pentru testare:');
    testUUIDs.forEach((uuid, index) => {
      console.log(`  - Test UUID ${index + 1}: ${uuid}`);
    });

    // 3. Generează exemple de testare cu UUID-uri reale
    console.log('\n3️⃣ Exemple de testare cu UUID-uri reale...');
    
    if (availableTables.length > 0) {
      const sampleTable = availableTables[0];
      console.log(`\n📝 Exemple pentru tabelul ${sampleTable.name}:`);
      console.log('```sql');
      console.log(`-- Test DELETE pe ${sampleTable.name} (ar trebui să eșueze dacă există protecție)`);
      console.log(`DELETE FROM public.${sampleTable.name} WHERE id = '${sampleTable.sampleId}';`);
      console.log('');
      console.log(`-- Test UPDATE pe ${sampleTable.name} (ar trebui să funcționeze)`);
      console.log(`UPDATE public.${sampleTable.name} SET updated_at = now() WHERE id = '${sampleTable.sampleId}';`);
      console.log('```');
    }

    // 4. Generează exemple pentru neurons (dacă există)
    console.log('\n4️⃣ Exemple specifice pentru DELETE-01...');
    
    const neuronsTable = availableTables.find(t => t.name === 'neurons');
    if (neuronsTable) {
      console.log('```sql');
      console.log('-- Test DELETE pe neurons (ar trebui să eșueze după implementarea DELETE-01)');
      console.log(`DELETE FROM public.neurons WHERE id = '${neuronsTable.sampleId}';`);
      console.log('');
      console.log('-- Test soft-delete prin UPDATE (ar trebui să funcționeze)');
      console.log(`UPDATE public.neurons SET published = false WHERE id = '${neuronsTable.sampleId}';`);
      console.log('');
      console.log('-- Test restore prin UPDATE (ar trebui să funcționeze)');
      console.log(`UPDATE public.neurons SET published = true WHERE id = '${neuronsTable.sampleId}';`);
      console.log('```');
    } else {
      console.log('⚠️  Tabelul neurons nu are date pentru testare');
      console.log('💡 Poți crea un neuron de test cu:');
      console.log('```sql');
      console.log('INSERT INTO public.neurons (slug, title, summary, content_full, required_tier, price_cents, digital_root, category, tags, depth_score, pattern_complexity, published) VALUES');
      console.log("('test-neuron', 'Test Neuron', 'Test summary', 'Test content', 'free', 0, 0, 'test', ARRAY['test'], 1, 1, true);");
      console.log('```');
    }

    // 5. Raport final
    console.log('\n📊 RAPORT FINAL GENERARE UUID-URI:');
    console.log('====================================');
    
    console.log('🔧 UUID-uri generate pentru testare:');
    testUUIDs.forEach((uuid, index) => {
      console.log(`  - Test UUID ${index + 1}: ${uuid}`);
    });
    
    console.log('\n📝 Exemple de testare:');
    console.log('  - Folosește UUID-urile generate pentru teste');
    console.log('  - Înlocuiește UUID-urile din exemplele SQL');
    console.log('  - Testează protecția DELETE după implementare');
    
    console.log('\n🚀 Următorii pași:');
    console.log('  1. Implementează DELETE-01 cu scriptul SQL corectat');
    console.log('  2. Testează protecția cu UUID-urile generate');
    console.log('  3. Confirmă că DELETE este blocat');
    console.log('  4. Validează funcțiile soft-delete');

  } catch (error) {
    console.error('❌ Eroare la generarea UUID-urilor de test:', error);
  }
}

// Rulează generarea
generateTestUUIDs().catch(console.error);
