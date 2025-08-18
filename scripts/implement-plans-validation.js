#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function implementPlansValidation() {
  console.log('🚀 Implementare validare PLANS-01...\n');

  try {
    // 1. Creează funcția f_is_root2_eur_cents
    console.log('1️⃣ Creez funcția f_is_root2_eur_cents...');
    const createRoot2Function = `
      CREATE OR REPLACE FUNCTION public.f_is_root2_eur_cents(cents int)
      RETURNS boolean
      LANGUAGE sql IMMUTABLE AS $$
        SELECT CASE 
          WHEN cents IS NULL OR cents <= 0 THEN false
          ELSE (
            SELECT CASE 
              WHEN n IS NULL OR n <= 0 THEN false
              ELSE 1 + ((n - 1) % 9) = 2
            END
            FROM (SELECT cents / 100 AS n) AS sub
          )
        END
      $$;
    `;
    
    const { error: root2Error } = await supabase.rpc('exec_sql', { sql_query: createRoot2Function });
    if (root2Error) {
      console.log('⚠️  Funcția f_is_root2_eur_cents există deja sau nu poate fi creată');
    } else {
      console.log('✅ Funcția f_is_root2_eur_cents creată');
    }

    // 2. Creează view-ul v_plans_sanity
    console.log('\n2️⃣ Creez view-ul v_plans_sanity...');
    const createSanityView = `
      CREATE OR REPLACE VIEW public.v_plans_sanity AS
      SELECT
        p.code,
        p.name,
        p.percent_access,
        p.monthly_price_cents AS m,
        p.annual_price_cents  AS y,
        p.stripe_price_id_month AS sm,
        p.stripe_price_id_year  AS sy,
        -- validări
        (p.percent_access = public.f_plan_percent_access(p.code)) AS ok_percent,
        ( (p.code='free' AND p.m=0 AND p.y=0) OR (p.code<>'free' AND p.m>0 AND p.y>0) ) AS ok_free_vs_paid,
        ( p.code='free' OR (public.f_is_root2_eur_cents(p.m) AND public.f_is_root2_eur_cents(p.y)) ) AS ok_root2,
        ( (p.code='free' AND p.sm IS NULL AND p.sy IS NULL)
          OR (p.code<>'free' AND p.sm IS NOT NULL AND p.sy IS NOT NULL) ) AS ok_stripe
      FROM public.plans p
      WHERE NOT (
        (p.percent_access = public.f_plan_percent_access(p.code))
        AND ( (p.code='free' AND p.monthly_price_cents=0 AND p.annual_price_cents=0)
              OR (p.code<>'free' AND p.monthly_price_cents>0 AND p.annual_price_cents>0) )
        AND ( p.code='free' OR (public.f_is_root2_eur_cents(p.monthly_price_cents) AND public.f_is_root2_eur_cents(p.annual_price_cents)) )
        AND ( (p.code='free' AND p.stripe_price_id_month IS NULL AND p.stripe_price_id_year IS NULL)
              OR (p.code<>'free' AND p.stripe_price_id_month IS NOT NULL AND p.stripe_price_id_year IS NOT NULL) )
      );
    `;
    
    const { error: sanityError } = await supabase.rpc('exec_sql', { sql_query: createSanityView });
    if (sanityError) {
      console.log('⚠️  View-ul v_plans_sanity nu poate fi creat prin exec_sql');
    } else {
      console.log('✅ View-ul v_plans_sanity creat');
    }

    // 3. Creează funcția f_assert_plans_sane
    console.log('\n3️⃣ Creez funcția f_assert_plans_sane...');
    const createAssertFunction = `
      CREATE OR REPLACE FUNCTION public.f_assert_plans_sane()
      RETURNS void
      LANGUAGE plpgsql AS $$
      DECLARE v_cnt int;
      BEGIN
        SELECT COUNT(*) INTO v_cnt FROM public.v_plans_sanity;
        IF v_cnt > 0 THEN
          RAISE EXCEPTION 'Plans seed invalid: % issue(s). See v_plans_sanity.', v_cnt;
        END IF;
      END $$;
    `;
    
    const { error: assertError } = await supabase.rpc('exec_sql', { sql_query: createAssertFunction });
    if (assertError) {
      console.log('⚠️  Funcția f_assert_plans_sane nu poate fi creată prin exec_sql');
    } else {
      console.log('✅ Funcția f_assert_plans_sane creată');
    }

    // 4. Creează view-ul v_plans_public
    console.log('\n4️⃣ Creez view-ul v_plans_public...');
    const createPublicView = `
      CREATE OR REPLACE VIEW public.v_plans_public AS
      SELECT
        code,
        name,
        percent_access,
        monthly_price_cents,
        annual_price_cents,
        created_at,
        updated_at
      FROM public.plans
      ORDER BY public.f_plan_rank(code);
    `;
    
    const { error: publicError } = await supabase.rpc('exec_sql', { sql_query: createPublicView });
    if (publicError) {
      console.log('⚠️  View-ul v_plans_public nu poate fi creat prin exec_sql');
    } else {
      console.log('✅ View-ul v_plans_public creat');
    }

    // 5. Testează funcțiile create
    console.log('\n5️⃣ Testez funcțiile create...');
    
    // Testează f_is_root2_eur_cents
    try {
      const { data: root2Test, error: root2TestError } = await supabase.rpc('f_is_root2_eur_cents', { cents: 2900 });
      if (root2TestError) {
        console.log('❌ f_is_root2_eur_cents nu funcționează:', root2TestError.message);
      } else {
        console.log('✅ f_is_root2_eur_cents(2900) =', root2Test);
      }
    } catch (e) {
      console.log('❌ f_is_root2_eur_cents nu există încă');
    }

    // Testează v_plans_sanity
    try {
      const { data: sanityData, error: sanityTestError } = await supabase.from('v_plans_sanity').select('*');
      if (sanityTestError) {
        console.log('❌ v_plans_sanity nu funcționează:', sanityTestError.message);
      } else {
        console.log('✅ v_plans_sanity returnează', sanityData.length, 'probleme');
        if (sanityData.length > 0) {
          console.log('⚠️  Probleme găsite:', sanityData);
        }
      }
    } catch (e) {
      console.log('❌ v_plans_sanity nu există încă');
    }

    // Testează f_assert_plans_sane
    try {
      const { data: assertData, error: assertTestError } = await supabase.rpc('f_assert_plans_sane');
      if (assertTestError) {
        console.log('❌ f_assert_plans_sane nu funcționează:', assertTestError.message);
      } else {
        console.log('✅ f_assert_plans_sane executat cu succes');
      }
    } catch (e) {
      console.log('❌ f_assert_plans_sane nu există încă');
    }

    // 6. Raport final
    console.log('\n📊 RAPORT FINAL PLANS-01:');
    console.log('================================');
    
    // Verifică planurile existente
    const { data: plans, error: plansError } = await supabase.from('plans').select('*');
    if (plansError) {
      console.log('❌ Nu pot accesa tabelul plans:', plansError.message);
    } else {
      console.log(`📋 Planuri găsite: ${plans.length}`);
      
      for (const plan of plans) {
        const monthlyRoot = plan.monthly_price_cents > 0 ? 
          (plan.monthly_price_cents / 100).toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0) : 0;
        const annualRoot = plan.annual_price_cents > 0 ? 
          (plan.annual_price_cents / 100).toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0) : 0;
        
        console.log(`  ${plan.code.toUpperCase()}:`);
        console.log(`    Monthly: ${plan.monthly_price_cents/100}€ (root: ${monthlyRoot})`);
        console.log(`    Annual: ${plan.annual_price_cents/100}€ (root: ${annualRoot})`);
        console.log(`    Stripe IDs: ${plan.stripe_price_id_month ? '✅' : '❌'} / ${plan.stripe_price_id_year ? '✅' : '❌'}`);
        console.log(`    Percent: ${plan.percent_access}% (expected: ${plan.code === 'free' ? 10 : plan.code === 'architect' ? 40 : plan.code === 'initiate' ? 70 : 100})`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Eroare la implementarea validării:', error);
  }
}

// Rulează implementarea
implementPlansValidation().catch(console.error);
