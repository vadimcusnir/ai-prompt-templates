#!/usr/bin/env node

/**
 * Script de testare completă pentru schema pe database-ul de dezvoltare
 * Testează: schema, prețuri Stripe, user tier logic, indexuri, performanța
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

// Funcții de testare
class SchemaTester {
  constructor() {
    this.results = {
      schema: { passed: 0, failed: 0, errors: [] },
      pricing: { passed: 0, failed: 0, errors: [] },
      userTier: { passed: 0, failed: 0, errors: [] },
      indexes: { passed: 0, failed: 0, errors: [] },
      performance: { passed: 0, failed: 0, errors: [] }
    };
  }

  async runAllTests() {
    console.log('🚀 Începe testarea completă a schemei...\n');
    
    try {
      await this.testSchemaValidation();
      await this.testPricingStripe();
      await this.testUserTierLogic();
      await this.testIndexes();
      await this.testPerformance();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Eroare în testarea schemei:', error);
    }
  }

  async testSchemaValidation() {
    console.log('📋 Testare validare schema...');
    
    try {
      // Test 1: Verifică dacă toate tabelele există
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['neurons', 'library_tree', 'bundles', 'plans', 'library_tree_neurons', 'bundle_neurons']);

      if (error) throw error;
      
      if (tables.length === 6) {
        console.log('✅ Toate tabelele principale există');
        this.results.schema.passed++;
      } else {
        console.log('❌ Lipsește tabele:', 6 - tables.length);
        this.results.schema.failed++;
      }

      // Test 2: Verifică RLS
      const { data: rlsTables, error: rlsError } = await supabase.rpc('f_test_rls_policies');
      if (rlsError) throw rlsError;
      
      if (rlsTables && rlsTables.length > 0) {
        console.log('✅ RLS este activ pe toate tabelele');
        this.results.schema.passed++;
      } else {
        console.log('❌ RLS nu este configurat corect');
        this.results.schema.failed++;
      }

      // Test 3: Verifică digital root validation
      const { data: digitalRootCheck, error: drError } = await supabase
        .from('neurons')
        .select('id, price_cents, digital_root')
        .limit(5);

      if (drError) throw drError;
      
      const validDigitalRoot = digitalRootCheck.every(n => n.digital_root === 2);
      if (validDigitalRoot) {
        console.log('✅ Digital root validation funcționează');
        this.results.schema.passed++;
      } else {
        console.log('❌ Digital root validation eșuează');
        this.results.schema.failed++;
      }

    } catch (error) {
      console.error('❌ Eroare în testarea schemei:', error.message);
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

      // Test 2: Verifică prețurile din neurons
      const { data: neurons, error: nError } = await supabase
        .from('neurons')
        .select('id, base_price_cents, digital_root')
        .limit(10);

      if (nError) throw nError;

      const validNeuronPrices = neurons.every(n => n.digital_root === 2);
      if (validNeuronPrices) {
        console.log('✅ Prețurile neuronilor respectă digital root = 2');
        this.results.pricing.passed++;
      } else {
        console.log('❌ Unele prețuri ale neuronilor nu respectă digital root = 2');
        this.results.pricing.failed++;
      }

      // Test 3: Verifică prețurile din bundles
      const { data: bundles, error: bError } = await supabase
        .from('bundles')
        .select('id, price_cents, digital_root')
        .limit(5);

      if (bError) throw bError;

      const validBundlePrices = bundles.every(b => b.digital_root === 2);
      if (validBundlePrices) {
        console.log('✅ Prețurile bundle-urilor respectă digital root = 2');
        this.results.pricing.passed++;
      } else {
        console.log('❌ Unele prețuri ale bundle-urilor nu respectă digital root = 2');
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

      // Test 2: Verifică funcția f_can_access_neuron
      const { data: neurons, error: nError } = await supabase
        .from('neurons')
        .select('id, required_tier')
        .limit(5);

      if (nError) throw nError;

      for (const neuron of neurons) {
        const { data: canAccess, error: accessError } = await supabase.rpc('f_can_access_neuron', {
          p_neuron_id: neuron.id,
          p_user_tier: 'free'
        });

        if (accessError) throw accessError;

        if (typeof canAccess === 'boolean') {
          console.log(`✅ Acces la neuron ${neuron.id}: ${canAccess}`);
          this.results.userTier.passed++;
        } else {
          console.log(`❌ Eroare în verificarea accesului la neuron ${neuron.id}`);
          this.results.userTier.failed++;
        }
      }

      // Test 3: Verifică funcția f_plan_percent_access
      const { data: percentAccess, error: paError } = await supabase.rpc('f_plan_percent_access', {
        p_plan_tier: 'elite'
      });

      if (paError) throw paError;

      if (percentAccess === 100) {
        console.log('✅ Funcția f_plan_percent_access returnează procentul corect');
        this.results.userTier.passed++;
      } else {
        console.log('❌ Funcția f_plan_percent_access nu returnează procentul corect');
        this.results.userTier.failed++;
      }

    } catch (error) {
      console.error('❌ Eroare în testarea logicii user tier:', error.message);
      this.results.userTier.errors.push(error.message);
      this.results.userTier.failed++;
    }
  }

  async testIndexes() {
    console.log('\n🔍 Testare indexuri...');
    
    try {
      // Test 1: Verifică indexurile existente
      const { data: indexes, error } = await supabase
        .from('pg_indexes')
        .select('indexname, tablename, indexdef')
        .eq('schemaname', 'public')
        .in('tablename', ['neurons', 'bundles', 'plans']);

      if (error) throw error;

      const requiredIndexes = [
        'idx_neurons_tier_published',
        'idx_bundles_tier',
        'idx_neurons_soft_delete',
        'idx_bundles_soft_delete'
      ];

      const foundIndexes = indexes.filter(idx => 
        requiredIndexes.some(required => idx.indexname.includes(required))
      );

      if (foundIndexes.length >= 2) {
        console.log(`✅ Găsite ${foundIndexes.length} indexuri de performanță`);
        this.results.indexes.passed++;
      } else {
        console.log('❌ Lipsește indexuri de performanță');
        this.results.indexes.failed++;
      }

      // Test 2: Verifică indexurile pentru căutare
      const searchIndexes = indexes.filter(idx => 
        idx.indexdef.includes('required_tier') || 
        idx.indexdef.includes('published') ||
        idx.indexdef.includes('deleted_at')
      );

      if (searchIndexes.length > 0) {
        console.log('✅ Indexuri pentru căutare optimizată există');
        this.results.indexes.passed++;
      } else {
        console.log('❌ Lipsește indexuri pentru căutare');
        this.results.indexes.failed++;
      }

    } catch (error) {
      console.error('❌ Eroare în testarea indexurilor:', error.message);
      this.results.indexes.errors.push(error.message);
      this.results.indexes.failed++;
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
        p_plan_tier: 'architect'
      });

      const rpcEndTime = Date.now();
      const rpcTime = rpcEndTime - rpcStartTime;

      if (rpcError) throw rpcError;

      if (rpcTime < 100) {
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
    console.log('\n📊 RAPORT FINAL DE TESTARE');
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
    } else {
      console.log('\n⚠️ Unele teste au eșuat. Verifică erorile de mai sus.');
    }
  }
}

// Rulare testare
async function main() {
  const tester = new SchemaTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SchemaTester;
