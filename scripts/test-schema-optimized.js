#!/usr/bin/env node

/**
 * Script de testare optimizat pentru schema pe database-ul de dezvoltare
 * Evită problemele cu tabelele de sistem și se concentrează pe funcționalitatea reală
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurare Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabile de mediu Supabase lipsesc!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Funcții de testare optimizate
class OptimizedSchemaTester {
  constructor() {
    this.results = {
      schema: { passed: 0, failed: 0, errors: [] },
      pricing: { passed: 0, failed: 0, errors: [] },
      userTier: { passed: 0, failed: 0, errors: [] },
      performance: { passed: 0, failed: 0, errors: [] }
    };
  }

  async runAllTests() {
    console.log('🚀 Începe testarea optimizată a schemei...\n');
    
    try {
      await this.testSchemaBasics();
      await this.testPricingStripe();
      await this.testUserTierLogic();
      await this.testPerformance();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Eroare în testarea schemei:', error);
    }
  }

  async testSchemaBasics() {
    console.log('📋 Testare schema de bază...');
    
    try {
      // Test 1: Verifică dacă poți accesa tabelele principale
      const tables = ['plans', 'neurons', 'bundles', 'library_tree', 'user_subscriptions'];
      let accessibleTables = 0;
      
      for (const tableName of tables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ Tabelul ${tableName}: ${error.message}`);
          } else {
            console.log(`✅ Tabelul ${tableName}: accesibil (${data?.length || 0} rânduri)`);
            accessibleTables++;
          }
        } catch (e) {
          console.log(`❌ Eroare la accesarea tabelului ${tableName}: ${e.message}`);
        }
      }
      
      if (accessibleTables === tables.length) {
        console.log('✅ Toate tabelele sunt accesibile!');
        this.results.schema.passed++;
      } else {
        console.log(`⚠️ Doar ${accessibleTables}/${tables.length} tabele sunt accesibile`);
        this.results.schema.failed++;
      }

      // Test 2: Verifică dacă planurile au fost create
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .order('code');

      if (plansError) {
        console.log('❌ Eroare la accesarea planurilor:', plansError.message);
        this.results.schema.failed++;
      } else if (plans && plans.length >= 4) {
        console.log(`✅ Planurile au fost create: ${plans.length} planuri găsite`);
        this.results.schema.passed++;
      } else {
        console.log('⚠️ Planurile nu au fost create complet');
        this.results.schema.failed++;
      }

    } catch (error) {
      console.error('❌ Eroare în testarea schemei de bază:', error.message);
      this.results.schema.errors.push(error.message);
      this.results.schema.failed++;
    }
  }

  async testPricingStripe() {
    console.log('\n💰 Testare prețuri Stripe...');
    
    try {
      // Test 1: Verifică prețurile din plans
      const { data: plans, error } = await supabase
        .from('plans')
        .select('*')
        .order('code');

      if (error) throw error;

      // Verifică digital root pentru prețuri
      const validPrices = plans.every(plan => {
        if (plan.code === 'free') return true;
        return this.calculateDigitalRoot(plan.monthly_price_cents) === 2 &&
               this.calculateDigitalRoot(plan.annual_price_cents) === 2;
      });

      if (validPrices) {
        console.log('✅ Toate prețurile respectă digital root = 2');
        this.results.pricing.passed++;
      } else {
        console.log('❌ Unele prețuri nu respectă digital root = 2');
        this.results.pricing.failed++;
      }

      // Test 2: Verifică că planurile au ID-uri Stripe
      const plansWithStripe = plans.filter(plan => 
        plan.code !== 'free' && 
        plan.stripe_price_id_month && 
        plan.stripe_price_id_year
      );

      if (plansWithStripe.length >= 3) {
        console.log('✅ Planurile au ID-uri Stripe configurate');
        this.results.pricing.passed++;
      } else {
        console.log('⚠️ Nu toate planurile au ID-uri Stripe');
        this.results.pricing.failed++;
      }

      // Test 3: Verifică că prețurile sunt corecte
      const expectedPrices = {
        'architect': { monthly: 2900, annual: 29900 },
        'initiate': { monthly: 7400, annual: 74900 },
        'elite': { monthly: 29900, annual: 299900 }
      };

      const correctPrices = plans.every(plan => {
        if (plan.code === 'free') return true;
        const expected = expectedPrices[plan.code];
        return expected && 
               plan.monthly_price_cents === expected.monthly &&
               plan.annual_price_cents === expected.annual;
      });

      if (correctPrices) {
        console.log('✅ Toate prețurile sunt corecte');
        this.results.pricing.passed++;
      } else {
        console.log('❌ Unele prețuri nu sunt corecte');
        this.results.pricing.failed++;
      }

    } catch (error) {
      console.error('❌ Eroare în testarea prețurilor:', error.message);
      this.results.pricing.errors.push(error.message);
      this.results.pricing.failed++;
    }
  }

  async testUserTierLogic() {
    console.log('\n👤 Testare logică user tier...');
    
    try {
      // Test 1: Verifică funcția f_get_current_user_tier
      const { data: userTier, error } = await supabase.rpc('f_get_current_user_tier');
      
      if (error) throw error;
      
      if (userTier === 'free') {
        console.log('✅ Funcția f_get_current_user_tier returnează tier-ul corect');
        this.results.userTier.passed++;
      } else {
        console.log('❌ Funcția f_get_current_user_tier nu returnează tier-ul corect');
        this.results.userTier.failed++;
      }

      // Test 2: Verifică funcția f_plan_percent_access
      const { data: percentAccess, error: paError } = await supabase.rpc('f_plan_percent_access', {
        t: 'elite'
      });

      if (paError) throw paError;

      if (percentAccess === 100) {
        console.log('✅ Funcția f_plan_percent_access returnează procentul corect');
        this.results.userTier.passed++;
      } else {
        console.log('❌ Funcția f_plan_percent_access nu returnează procentul corect');
        this.results.userTier.failed++;
      }

      // Test 3: Verifică funcția f_plan_rank
      const { data: planRank, error: prError } = await supabase.rpc('f_plan_rank', {
        t: 'architect'
      });

      if (prError) throw prError;

      if (planRank === 1) {
        console.log('✅ Funcția f_plan_rank returnează rank-ul corect');
        this.results.userTier.passed++;
      } else {
        console.log('❌ Funcția f_plan_rank nu returnează rank-ul corect');
        this.results.userTier.failed++;
      }

      // Test 4: Verifică funcția f_digital_root
      const { data: digitalRoot, error: drError } = await supabase.rpc('f_digital_root', {
        n: 299
      });

      if (drError) throw drError;

      if (digitalRoot === 2) {
        console.log('✅ Funcția f_digital_root returnează valoarea corectă');
        this.results.userTier.passed++;
      } else {
        console.log('❌ Funcția f_digital_root nu returnează valoarea corectă');
        this.results.userTier.failed++;
      }

    } catch (error) {
      console.error('❌ Eroare în testarea logicii user tier:', error.message);
      this.results.userTier.errors.push(error.message);
      this.results.userTier.failed++;
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testare performanță...');
    
    try {
      // Test 1: Performanța căutării neuronilor
      const startTime = Date.now();
      
      const { data: neurons, error } = await supabase
        .from('neurons')
        .select('id, title, required_tier, published')
        .eq('published', true)
        .eq('required_tier', 'free')
        .limit(100);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      if (error) throw error;

      if (queryTime < 1000) {
        console.log(`✅ Căutarea neuronilor: ${queryTime}ms (rapidă)`);
        this.results.performance.passed++;
      } else {
        console.log(`⚠️ Căutarea neuronilor: ${queryTime}ms (lentă)`);
        this.results.performance.failed++;
      }

      // Test 2: Performanța căutării în tree
      const treeStartTime = Date.now();
      
      const { data: treeNodes, error: treeError } = await supabase
        .from('library_tree')
        .select('id, name, path')
        .is('deleted_at', null)
        .limit(50);

      const treeEndTime = Date.now();
      const treeQueryTime = treeEndTime - treeStartTime;

      if (treeError) throw treeError;

      if (treeQueryTime < 500) {
        console.log(`✅ Căutarea în tree: ${treeQueryTime}ms (rapidă)`);
        this.results.performance.passed++;
      } else {
        console.log(`⚠️ Căutarea în tree: ${treeQueryTime}ms (lentă)`);
        this.results.performance.failed++;
      }

      // Test 3: Performanța funcțiilor RPC
      const rpcStartTime = Date.now();
      
      const { data: planAccess, error: rpcError } = await supabase.rpc('f_plan_percent_access', {
        t: 'architect'
      });

      const rpcEndTime = Date.now();
      const rpcTime = rpcEndTime - rpcStartTime;

      if (rpcError) throw rpcError;

      if (rpcTime < 200) {
        console.log(`✅ Funcții RPC: ${rpcTime}ms (rapide)`);
        this.results.performance.passed++;
      } else {
        console.log(`⚠️ Funcții RPC: ${rpcTime}ms (lente)`);
        this.results.performance.failed++;
      }

    } catch (error) {
      console.error('❌ Eroare în testarea performanței:', error.message);
      this.results.performance.errors.push(error.message);
      this.results.performance.failed++;
    }
  }

  calculateDigitalRoot(n) {
    if (n <= 0) return null;
    return 1 + ((n - 1) % 9);
  }

  async generateReport() {
    console.log('\n📊 RAPORT FINAL DE TESTARE OPTIMIZAT');
    console.log('=' .repeat(50));
    
    const categories = Object.keys(this.results);
    let totalPassed = 0;
    let totalFailed = 0;

    categories.forEach(category => {
      const result = this.results[category];
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      
      console.log(`\n${categoryName}:`);
      console.log(`  ✅ Teste reușite: ${result.passed}`);
      console.log(`  ❌ Teste eșuate: ${result.failed}`);
      
      if (result.errors.length > 0) {
        console.log(`  🚨 Erori:`);
        result.errors.forEach(error => console.log(`    - ${error}`));
      }
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });

    console.log('\n' + '=' .repeat(50));
    console.log(`TOTAL: ${totalPassed + totalFailed} teste`);
    console.log(`✅ Reușite: ${totalPassed}`);
    console.log(`❌ Eșuate: ${totalFailed}`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 Toate testele au trecut cu succes!');
    } else if (totalPassed >= totalFailed * 2) {
      console.log('\n✅ Majoritatea testelor au trecut cu succes!');
    } else {
      console.log('\n⚠️ Multe teste au eșuat. Verifică erorile de mai sus.');
    }
  }
}

// Rulare testare
async function main() {
  const tester = new OptimizedSchemaTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = OptimizedSchemaTester;
