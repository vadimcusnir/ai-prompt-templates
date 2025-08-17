#!/usr/bin/env node

/**
 * Script pentru generarea de date de test cu prețuri reale
 * și testarea performanței cu volume mari de date
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

// Funcții pentru generarea de date de test
class TestDataGenerator {
  constructor() {
    this.stats = {
      neurons: 0,
      bundles: 0,
      treeNodes: 0,
      subscriptions: 0
    };
  }

  async generateTestData() {
    console.log('🚀 Începe generarea de date de test...\n');
    
    try {
      await this.generateNeurons();
      await this.generateBundles();
      await this.generateLibraryTree();
      await this.generateUserSubscriptions();
      await this.generatePerformanceTest();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Eroare în generarea datelor de test:', error);
    }
  }

  async generateNeurons() {
    console.log('🧠 Generare neuroni de test...');
    
    const neuronTemplates = [
      {
        title: 'Chain of Thought Prompting',
        slug: 'chain-of-thought-prompting',
        cognitive_category: 'Reasoning',
        difficulty_tier: 'Intermediate',
        required_tier: 'free',
        cognitive_depth_score: 6,
        pattern_complexity: 3,
        context_frame: 'Problem solving and logical reasoning',
        required_inputs: ['problem_description', 'step_by_step_thinking', 'final_answer'],
        protocol_steps: [
          '1. Break down the problem',
          '2. Think step by step', 
          '3. Show your work',
          '4. Arrive at conclusion'
        ],
        antipatterns: ['jumping_to_conclusion', 'skipping_steps', 'assumptions'],
        rapid_test: 'Ask AI to solve: "If I have 3 apples and give away 2, how many do I have left?"',
        extensions: ['tree_of_thoughts', 'self_consistency', 'least_to_most'],
        meaning_layers: ['logical_flow', 'transparency', 'verifiability'],
        anti_surface_features: ['surface_answers', 'black_box_reasoning'],
        use_cases: ['mathematics', 'logic_puzzles', 'decision_making'],
        pricing_tier: 'free',
        base_price_cents: 0
      },
      {
        title: 'Few-Shot Learning Framework',
        slug: 'few-shot-learning-framework',
        cognitive_category: 'Learning',
        difficulty_tier: 'Advanced',
        required_tier: 'architect',
        cognitive_depth_score: 8,
        pattern_complexity: 5,
        context_frame: 'Rapid adaptation to new tasks with minimal examples',
        required_inputs: ['task_description', 'few_examples', 'target_output'],
        protocol_steps: [
          '1. Identify task pattern',
          '2. Extract key features',
          '3. Apply to new input',
          '4. Validate output'
        ],
        antipatterns: ['overfitting', 'ignoring_context', 'poor_examples'],
        rapid_test: 'Provide 2 examples of sentiment analysis and test on new text',
        extensions: ['meta_learning', 'zero_shot', 'one_shot'],
        meaning_layers: ['pattern_recognition', 'generalization', 'adaptation'],
        anti_surface_features: ['memorization', 'rigid_patterns'],
        use_cases: ['NLP', 'computer_vision', 'recommendation_systems'],
        pricing_tier: 'architect',
        base_price_cents: 2900
      },
      {
        title: 'Tree of Thoughts Reasoning',
        slug: 'tree-of-thoughts-reasoning',
        cognitive_category: 'Reasoning',
        difficulty_tier: 'Expert',
        required_tier: 'initiate',
        cognitive_depth_score: 9,
        pattern_complexity: 7,
        context_frame: 'Multi-path exploration of reasoning chains',
        required_inputs: ['initial_problem', 'branching_criteria', 'evaluation_metrics'],
        protocol_steps: [
          '1. Generate initial thoughts',
          '2. Branch into multiple paths',
          '3. Evaluate each branch',
          '4. Select optimal path',
          '5. Iterate and refine'
        ],
        antipatterns: ['infinite_branching', 'poor_evaluation', 'ignoring_alternatives'],
        rapid_test: 'Solve complex puzzle by exploring 3 different approaches',
        extensions: ['beam_search', 'monte_carlo', 'genetic_algorithms'],
        meaning_layers: ['exploration', 'evaluation', 'optimization'],
        anti_surface_features: ['linear_thinking', 'single_solution'],
        use_cases: ['research', 'strategy_games', 'optimization_problems'],
        pricing_tier: 'initiate',
        base_price_cents: 7400
      },
      {
        title: 'Meta-Cognitive Framework',
        slug: 'meta-cognitive-framework',
        cognitive_category: 'Meta-Learning',
        difficulty_tier: 'Master',
        required_tier: 'elite',
        cognitive_depth_score: 10,
        pattern_complexity: 9,
        context_frame: 'Learning how to learn and optimize cognitive processes',
        required_inputs: ['learning_objective', 'current_methods', 'performance_metrics'],
        protocol_steps: [
          '1. Assess current approach',
          '2. Identify improvement areas',
          '3. Design new strategies',
          '4. Implement and test',
          '5. Measure and iterate'
        ],
        antipatterns: ['analysis_paralysis', 'ignoring_feedback', 'rigid_methods'],
        rapid_test: 'Analyze your learning process and suggest 3 improvements',
        extensions: ['auto_ml', 'neural_architecture_search', 'hyperparameter_optimization'],
        meaning_layers: ['self_awareness', 'adaptation', 'optimization'],
        anti_surface_features: ['static_methods', 'blind_application'],
        use_cases: ['research', 'education', 'AI_development'],
        pricing_tier: 'elite',
        base_price_cents: 29900
      }
    ];

    for (const template of neuronTemplates) {
      const { data, error } = await supabase
        .from('neurons')
        .insert({
          title: template.title,
          slug: template.slug,
          cognitive_category: template.cognitive_category,
          difficulty_tier: template.difficulty_tier,
          required_tier: template.required_tier,
          cognitive_depth_score: template.cognitive_depth_score,
          pattern_complexity: template.pattern_complexity,
          context_frame: template.context_frame,
          required_inputs: template.required_inputs,
          protocol_steps: template.protocol_steps,
          antipatterns: template.antipatterns,
          rapid_test: template.rapid_test,
          extensions: template.extensions,
          meaning_layers: template.meaning_layers,
          anti_surface_features: template.anti_surface_features,
          use_cases: template.use_cases,
          pricing_tier: template.pricing_tier,
          base_price_cents: template.base_price_cents,
          // digital_root se calculează automat prin GENERATED ALWAYS AS
          published: true
        })
        .select();

      if (error) {
        console.error(`❌ Eroare la inserarea neuronului ${template.title}:`, error.message);
      } else {
        console.log(`✅ Neuron creat: ${template.title}`);
        this.stats.neurons++;
      }
    }
  }

  async generateBundles() {
    console.log('\n📦 Generare bundle-uri de test...');
    
    const bundleTemplates = [
      {
        title: 'Reasoning Mastery Bundle',
        slug: 'reasoning-mastery-bundle',
        description: 'Complete framework for advanced reasoning and problem solving',
        price_cents: 2900, // 29 EUR -> digital root = 2 (respectă regula)
        required_tier: 'architect'
      },
      {
        title: 'AI Learning Pro Bundle',
        slug: 'ai-learning-pro-bundle',
        description: 'Professional AI learning frameworks and methodologies',
        price_cents: 29900,
        required_tier: 'initiate'
      },
      {
        title: 'Cognitive Excellence Bundle',
        slug: 'cognitive-excellence-bundle',
        description: 'Elite cognitive frameworks for master-level AI practitioners',
        price_cents: 74900,
        required_tier: 'elite'
      }
    ];

    for (const template of bundleTemplates) {
      const { data, error } = await supabase
        .from('bundles')
        .insert({
          title: template.title,
          slug: template.slug,
          description: template.description,
          price_cents: template.price_cents,
          // digital_root se calculează automat prin GENERATED ALWAYS AS
          required_tier: template.required_tier
        })
        .select();

      if (error) {
        console.error(`❌ Eroare la inserarea bundle-ului ${template.title}:`, error.message);
      } else {
        console.log(`✅ Bundle creat: ${template.title}`);
        this.stats.bundles++;
      }
    }
  }

  async generateLibraryTree() {
    console.log('\n🌳 Generare structură library tree...');
    
    const treeStructure = [
      { name: 'AI Fundamentals', path: 'ai-fundamentals', position: 1 },
      { name: 'Prompt Engineering', path: 'ai-fundamentals.prompt-engineering', position: 1 },
      { name: 'Cognitive Frameworks', path: 'ai-fundamentals.cognitive-frameworks', position: 2 },
      { name: 'Advanced Reasoning', path: 'ai-fundamentals.advanced-reasoning', position: 3 },
      { name: 'Meta-Learning', path: 'ai-fundamentals.meta-learning', position: 4 },
      { name: 'Specialized Domains', path: 'specialized-domains', position: 2 },
      { name: 'NLP & Language', path: 'specialized-domains.nlp-language', position: 1 },
      { name: 'Computer Vision', path: 'specialized-domains.computer-vision', position: 2 },
      { name: 'Decision Making', path: 'specialized-domains.decision-making', position: 3 }
    ];

    for (const node of treeStructure) {
      const { data, error } = await supabase
        .from('library_tree')
        .insert({
          name: node.name,
          path: node.path,
          position: node.position
        })
        .select();

      if (error) {
        console.error(`❌ Eroare la inserarea nodului ${node.name}:`, error.message);
      } else {
        console.log(`✅ Nod tree creat: ${node.name}`);
        this.stats.treeNodes++;
      }
    }
  }

  async generateUserSubscriptions() {
    console.log('\n👤 Generare subscription-uri de test...');
    
    // Simulează câteva subscription-uri pentru testare
    const testSubscriptions = [
      {
        user_id: '00000000-0000-0000-0000-000000000001',
        stripe_subscription_id: 'sub_test_architect_001',
        stripe_customer_id: 'cus_test_001',
        tier: 'architect',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: '00000000-0000-0000-0000-000000000002',
        stripe_subscription_id: 'sub_test_initiate_001',
        stripe_customer_id: 'cus_test_002',
        tier: 'initiate',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const sub of testSubscriptions) {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert(sub)
        .select();

      if (error) {
        console.error(`❌ Eroare la inserarea subscription-ului:`, error.message);
      } else {
        console.log(`✅ Subscription creat pentru tier: ${sub.tier}`);
        this.stats.subscriptions++;
      }
    }
  }

  async generatePerformanceTest() {
    console.log('\n⚡ Testare performanță cu date reale...');
    
    // Test 1: Căutare rapidă în neuroni
    const startTime = Date.now();
    const { data: neurons, error } = await supabase
      .from('neurons')
      .select('id, title, required_tier, published')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(100);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    if (error) {
      console.error('❌ Eroare în testul de performanță:', error.message);
    } else {
      console.log(`✅ Căutare neuroni: ${queryTime}ms pentru ${neurons.length} rezultate`);
      
      if (queryTime < 1000) {
        console.log('🚀 Performanță excelentă!');
      } else if (queryTime < 3000) {
        console.log('✅ Performanță bună');
      } else {
        console.log('⚠️ Performanța poate fi îmbunătățită');
      }
    }

    // Test 2: Căutare în tree cu path (folosesc operatori ltree)
    const treeStartTime = Date.now();
    const { data: treeNodes, error: treeError } = await supabase
      .from('library_tree')
      .select('id, name, path')
      .or('path.eq.ai-fundamentals,path.like.ai-fundamentals.*')
      .order('path');

    const treeEndTime = Date.now();
    const treeQueryTime = treeEndTime - treeStartTime;

    if (treeError) {
      console.error('❌ Eroare în testul tree:', treeError.message);
    } else {
      console.log(`✅ Căutare tree: ${treeQueryTime}ms pentru ${treeNodes.length} noduri`);
    }
  }

  calculateDigitalRoot(n) {
    if (n <= 0) return null;
    return 1 + ((n - 1) % 9);
  }

  async generateReport() {
    console.log('\n📊 RAPORT GENERARE DATE DE TEST');
    console.log('=' .repeat(50));
    console.log(`🧠 Neuroni creați: ${this.stats.neurons}`);
    console.log(`📦 Bundle-uri create: ${this.stats.bundles}`);
    console.log(`🌳 Noduri tree create: ${this.stats.treeNodes}`);
    console.log(`👤 Subscription-uri create: ${this.stats.subscriptions}`);
    console.log('\n🎉 Generarea datelor de test a fost finalizată!');
  }
}

// Rulare generator
async function main() {
  const generator = new TestDataGenerator();
  await generator.generateTestData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestDataGenerator;
