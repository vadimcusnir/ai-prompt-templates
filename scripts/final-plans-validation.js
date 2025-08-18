#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalPlansValidation() {
  console.log('🎯 VALIDARE FINALĂ PLANS-01\n');
  console.log('=' .repeat(50));

  try {
    // 1. Verifică planurile
    const { data: plans, error: plansError } = await supabase.from('plans').select('*');
    
    if (plansError) {
      console.log('❌ Eroare la accesarea planurilor:', plansError.message);
      return;
    }

    console.log(`📋 Planuri găsite: ${plans.length}\n`);

    // 2. Validează fiecare plan
    let validationResults = [];
    
    for (const plan of plans) {
      const result = validatePlan(plan);
      validationResults.push(result);
      
      console.log(`🔍 ${plan.code.toUpperCase()}:`);
      console.log(`  Monthly: ${plan.monthly_price_cents/100}€ (root: ${result.monthlyRoot})`);
      console.log(`  Annual: ${plan.annual_price_cents/100}€ (root: ${result.annualRoot})`);
      console.log(`  Stripe IDs: ${result.hasStripeIds ? '✅' : '❌'}`);
      console.log(`  Percent: ${plan.percent_access}% (expected: ${result.expectedPercent}%)`);
      console.log(`  Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`);
    }

    // 3. Raport final
    const validPlans = validationResults.filter(r => r.isValid).length;
    const totalPlans = validationResults.length;
    
    console.log('📊 RAPORT FINAL PLANS-01:');
    console.log('=' .repeat(50));
    console.log(`Planuri valide: ${validPlans}/${totalPlans}`);
    
    if (validPlans === totalPlans) {
      console.log('\n🎉 TOATE VALIDĂRILE AU TRECUT!');
      console.log('✅ Prețurile non-free au digital root = 2');
      console.log('✅ Planurile non-free au Stripe price IDs');
      console.log('✅ Planurile free au prețuri 0€ și nu au Stripe IDs');
      console.log('✅ Percentajele de acces sunt corecte');
      
      console.log('\n🚀 PLANS-01 ESTE VALIDAT CU SUCCES!');
    } else {
      console.log('\n❌ VALIDAREA A EȘUAT!');
      const invalidPlans = validationResults.filter(r => !r.isValid);
      invalidPlans.forEach(plan => {
        console.log(`  - ${plan.code}: ${plan.issues.join(', ')}`);
      });
    }

    // 4. Detalii tehnice
    console.log('\n🔧 DETALII TEHNICE:');
    console.log('=' .repeat(50));
    
    validationResults.forEach(result => {
      if (!result.isValid) {
        console.log(`\n${result.code.toUpperCase()} - Probleme:`);
        result.issues.forEach(issue => console.log(`  ❌ ${issue}`));
      }
    });

  } catch (error) {
    console.error('❌ Eroare la validarea finală:', error);
  }
}

function validatePlan(plan) {
  const result = {
    code: plan.code,
    monthlyRoot: calculateDigitalRoot(plan.monthly_price_cents / 100),
    annualRoot: calculateDigitalRoot(plan.annual_price_cents / 100),
    hasStripeIds: !!(plan.stripe_price_id_month && plan.stripe_price_id_year),
    expectedPercent: getExpectedPercent(plan.code),
    issues: [],
    isValid: true
  };

  // Validări
  if (plan.percent_access !== result.expectedPercent) {
    result.issues.push(`percent_access mismatch: ${plan.percent_access}% vs ${result.expectedPercent}%`);
    result.isValid = false;
  }

  if (plan.code === 'free') {
    if (plan.monthly_price_cents !== 0 || plan.annual_price_cents !== 0) {
      result.issues.push('free plan should have 0€ prices');
      result.isValid = false;
    }
    if (plan.stripe_price_id_month !== null || plan.stripe_price_id_year !== null) {
      result.issues.push('free plan should not have Stripe IDs');
      result.isValid = false;
    }
  } else {
    // Non-free plans
    if (plan.monthly_price_cents <= 0 || plan.annual_price_cents <= 0) {
      result.issues.push('non-free plan should have >0€ prices');
      result.isValid = false;
    }
    if (result.monthlyRoot !== 2) {
      result.issues.push(`monthly price root ${result.monthlyRoot} ≠ 2`);
      result.isValid = false;
    }
    if (result.annualRoot !== 2) {
      result.issues.push(`annual price root ${result.annualRoot} ≠ 2`);
      result.isValid = false;
    }
    if (!result.hasStripeIds) {
      result.issues.push('missing Stripe IDs');
      result.isValid = false;
    }
  }

  return result;
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

// Rulează validarea finală
finalPlansValidation().catch(console.error);
