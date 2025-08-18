#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validatePlansDirect() {
  console.log('🔍 Validare directă PLANS-01...\n');

  try {
    // 1. Verifică planurile existente
    console.log('1️⃣ Verific planurile existente...');
    const { data: plans, error: plansError } = await supabase.from('plans').select('*');
    
    if (plansError) {
      console.log('❌ Eroare la accesarea planurilor:', plansError.message);
      return;
    }

    console.log(`📋 Planuri găsite: ${plans.length}\n`);

    // 2. Validează fiecare plan
    let totalIssues = 0;
    const issues = [];

    for (const plan of plans) {
      console.log(`🔍 Validare ${plan.code.toUpperCase()}:`);
      
      // Calculează digital root
      const monthlyRoot = plan.monthly_price_cents > 0 ? 
        calculateDigitalRoot(plan.monthly_price_cents / 100) : 0;
      const annualRoot = plan.annual_price_cents > 0 ? 
        calculateDigitalRoot(plan.annual_price_cents / 100) : 0;
      
      console.log(`  Monthly: ${plan.monthly_price_cents/100}€ (root: ${monthlyRoot})`);
      console.log(`  Annual: ${plan.annual_price_cents/100}€ (root: ${annualRoot})`);
      
      // Validări
      let planIssues = 0;
      
      // 1. Verifică percent_access
      const expectedPercent = getExpectedPercent(plan.code);
      if (plan.percent_access !== expectedPercent) {
        console.log(`  ❌ Percent: ${plan.percent_access}% (expected: ${expectedPercent}%)`);
        planIssues++;
        issues.push(`${plan.code}: percent_access mismatch`);
      } else {
        console.log(`  ✅ Percent: ${plan.percent_access}%`);
      }
      
      // 2. Verifică prețurile free vs non-free
      if (plan.code === 'free') {
        if (plan.monthly_price_cents !== 0 || plan.annual_price_cents !== 0) {
          console.log(`  ❌ Free plan should have 0€ prices`);
          planIssues++;
          issues.push(`${plan.code}: free plan has non-zero prices`);
        } else {
          console.log(`  ✅ Free plan has 0€ prices`);
        }
        
        if (plan.stripe_price_id_month !== null || plan.stripe_price_id_year !== null) {
          console.log(`  ❌ Free plan should not have Stripe IDs`);
          planIssues++;
          issues.push(`${plan.code}: free plan has Stripe IDs`);
        } else {
          console.log(`  ✅ Free plan has no Stripe IDs`);
        }
      } else {
        // Non-free plans
        if (plan.monthly_price_cents <= 0 || plan.annual_price_cents <= 0) {
          console.log(`  ❌ Non-free plan should have >0€ prices`);
          planIssues++;
          issues.push(`${plan.code}: non-free plan has zero/negative prices`);
        } else {
          console.log(`  ✅ Non-free plan has >0€ prices`);
        }
        
        // 3. Verifică digital root = 2
        if (monthlyRoot !== 2) {
          console.log(`  ❌ Monthly price root ${monthlyRoot} ≠ 2`);
          planIssues++;
          issues.push(`${plan.code}: monthly price root ${monthlyRoot} ≠ 2`);
        } else {
          console.log(`  ✅ Monthly price root = 2`);
        }
        
        if (annualRoot !== 2) {
          console.log(`  ❌ Annual price root ${annualRoot} ≠ 2`);
          planIssues++;
          issues.push(`${plan.code}: annual price root ${annualRoot} ≠ 2`);
        } else {
          console.log(`  ✅ Annual price root = 2`);
        }
        
        // 4. Verifică Stripe IDs
        if (!plan.stripe_price_id_month || !plan.stripe_price_id_year) {
          console.log(`  ❌ Non-free plan missing Stripe IDs`);
          planIssues++;
          issues.push(`${plan.code}: missing Stripe IDs`);
        } else {
          console.log(`  ✅ Non-free plan has Stripe IDs`);
        }
      }
      
      totalIssues += planIssues;
      console.log(`  📊 Probleme găsite: ${planIssues}\n`);
    }

    // 3. Raport final
    console.log('📊 RAPORT FINAL PLANS-01:');
    console.log('================================');
    
    if (totalIssues === 0) {
      console.log('✅ TOATE VALIDĂRILE AU TRECUT!');
      console.log('✅ Prețurile non-free au digital root = 2');
      console.log('✅ Planurile non-free au Stripe price IDs');
      console.log('✅ Planurile free au prețuri 0€ și nu au Stripe IDs');
      console.log('✅ Percentajele de acces sunt corecte');
    } else {
      console.log(`❌ ${totalIssues} PROBLEME GĂSITE:`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      
      console.log('\n🔧 ACTIUNI NECESARE:');
      console.log('  1. Corectează prețurile pentru a avea digital root = 2');
      console.log('  2. Asigură-te că planurile non-free au Stripe IDs valide');
      console.log('  3. Verifică că planurile free au prețuri 0€');
    }

    // 4. Recomandări pentru corectare
    console.log('\n💡 RECOMANDĂRI PENTRU CORECTARE:');
    console.log('  - FREE: 0€ (root: 0) - corect');
    console.log('  - ARCHITECT: 29€ (root: 2) / 299€ (root: 2)');
    console.log('  - INITIATE: 74€ (root: 2) / 749€ (root: 2)');
    console.log('  - ELITE: 299€ (root: 2) / 2999€ (root: 2)');
    
    // Calculează prețurile corecte cu root = 2
    console.log('\n🧮 CALCUL PREȚURI CU ROOT = 2:');
    const correctPrices = calculateCorrectPrices();
    correctPrices.forEach(price => {
      console.log(`  ${price.eur}€ → ${price.cents} cenți → root: ${price.root}`);
    });

  } catch (error) {
    console.error('❌ Eroare la validarea planurilor:', error);
  }
}

function calculateDigitalRoot(num) {
  if (num <= 0) return 0;
  let n = Math.floor(num);
  while (n > 9) {
    n = n.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
  }
  return n;
}

function getExpectedPercent(code) {
  const percentMap = {
    'free': 10,
    'architect': 40,
    'initiate': 70,
    'elite': 100
  };
  return percentMap[code] || 0;
}

function calculateCorrectPrices() {
  const prices = [];
  const targetRoot = 2;
  
  // Generează prețuri cu root = 2
  for (let eur = 20; eur <= 3000; eur++) {
    const root = calculateDigitalRoot(eur);
    if (root === targetRoot) {
      prices.push({
        eur,
        cents: eur * 100,
        root
      });
    }
  }
  
  // Returnează doar câteva exemple relevante
  return prices.filter(p => [29, 74, 299, 749, 2999].includes(p.eur));
}

// Rulează validarea
validatePlansDirect().catch(console.error);
