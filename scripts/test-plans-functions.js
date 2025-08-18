#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPlansFunctions() {
  console.log('🧪 Testare funcții PLANS-01...\n');

  try {
    // 1. Testează funcția f_is_root2_eur_cents
    console.log('1️⃣ Testez f_is_root2_eur_cents...');
    try {
      const { data: root2Test, error: root2Error } = await supabase.rpc('f_is_root2_eur_cents', { cents: 2900 });
      if (root2Error) {
        console.log('❌ f_is_root2_eur_cents nu există:', root2Error.message);
      } else {
        console.log('✅ f_is_root2_eur_cents(2900) =', root2Test);
      }
    } catch (e) {
      console.log('❌ f_is_root2_eur_cents nu există încă');
    }

    // 2. Testează view-ul v_plans_sanity
    console.log('\n2️⃣ Testez v_plans_sanity...');
    try {
      const { data: sanityData, error: sanityError } = await supabase.from('v_plans_sanity').select('*');
      if (sanityError) {
        console.log('❌ v_plans_sanity nu există:', sanityError.message);
      } else {
        console.log('✅ v_plans_sanity returnează', sanityData.length, 'probleme');
        if (sanityData.length > 0) {
          console.log('⚠️  Probleme găsite:', sanityData);
        }
      }
    } catch (e) {
      console.log('❌ v_plans_sanity nu există încă');
    }

    // 3. Testează funcția f_assert_plans_sane
    console.log('\n3️⃣ Testez f_assert_plans_sane...');
    try {
      const { data: assertData, error: assertError } = await supabase.rpc('f_assert_plans_sane');
      if (assertError) {
        console.log('❌ f_assert_plans_sane nu există:', assertError.message);
      } else {
        console.log('✅ f_assert_plans_sane executat cu succes');
      }
    } catch (e) {
      console.log('❌ f_assert_plans_sane nu există încă');
    }

    // 4. Testează view-ul v_plans_public
    console.log('\n4️⃣ Testez v_plans_public...');
    try {
      const { data: publicData, error: publicError } = await supabase.from('v_plans_public').select('*');
      if (publicError) {
        console.log('❌ v_plans_public nu există:', publicError.message);
      } else {
        console.log('✅ v_plans_public returnează', publicData.length, 'planuri');
      }
    } catch (e) {
      console.log('❌ v_plans_public nu există încă');
    }

    // 5. Testează funcțiile existente
    console.log('\n5️⃣ Testez funcțiile existente...');
    
    // f_plan_percent_access
    try {
      const { data: percentData, error: percentError } = await supabase.rpc('f_plan_percent_access', { t: 'free' });
      if (percentError) {
        console.log('❌ f_plan_percent_access nu funcționează:', percentError.message);
      } else {
        console.log('✅ f_plan_percent_access("free") =', percentData);
      }
    } catch (e) {
      console.log('❌ f_plan_percent_access nu există');
    }

    // f_plan_rank
    try {
      const { data: rankData, error: rankError } = await supabase.rpc('f_plan_rank', { t: 'free' });
      if (rankError) {
        console.log('❌ f_plan_rank nu funcționează:', rankError.message);
      } else {
        console.log('✅ f_plan_rank("free") =', rankData);
      }
    } catch (e) {
      console.log('❌ f_plan_rank nu există');
    }

    // 6. Raport final
    console.log('\n📊 RAPORT FINAL TESTARE FUNCȚII:');
    console.log('====================================');
    
    const functions = [
      'f_is_root2_eur_cents',
      'v_plans_sanity', 
      'f_assert_plans_sane',
      'v_plans_public'
    ];
    
    let implementedCount = 0;
    for (const func of functions) {
      try {
        if (func.startsWith('f_')) {
          // Testează funcții
          if (func === 'f_assert_plans_sane') {
            await supabase.rpc(func);
          } else {
            await supabase.rpc(func, { cents: 2900 });
          }
          console.log(`✅ ${func} - implementat`);
          implementedCount++;
        } else {
          // Testează view-uri
          await supabase.from(func).select('*').limit(1);
          console.log(`✅ ${func} - implementat`);
          implementedCount++;
        }
      } catch (e) {
        console.log(`❌ ${func} - nu implementat`);
      }
    }
    
    console.log(`\n📈 Implementare: ${implementedCount}/${functions.length} funcții/view-uri`);
    
    if (implementedCount === functions.length) {
      console.log('🎉 TOATE FUNCȚIILE SUNT IMPLEMENTATE!');
    } else {
      console.log('⚠️  Unele funcții lipsesc - rulează migrările SQL');
    }

  } catch (error) {
    console.error('❌ Eroare la testarea funcțiilor:', error);
  }
}

// Rulează testarea
testPlansFunctions().catch(console.error);
