// 📄 FIȘIER: scripts/simple-generation.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tthyfqqdkifnerlsefmn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aHlmcXFka2lmbmVybHNlZm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIzMjc0MCwiZXhwIjoyMDcwODA4NzQwfQ.5Sl-fUlsdgnmi-MhBAhG_tCbOkWlCjFZR0yl7RME-M8'
);

// QUICK FRAMEWORK GENERATOR
function generateFramework(category, index) {
  return {
    title: `${category.replace('_', ' ')} Framework #${index}`,
    slug: `${category}-framework-${index}`,
    cognitive_category: 'ecommerce_optimization',
    difficulty_tier: 'advanced',
    required_tier: 'architect', 
    cognitive_depth_score: 8,
    pattern_complexity: 4,
    context_frame: `Advanced ${category} strategies for ecommerce success.`,
    required_inputs: [
      "Business context and goals",
      "Current performance metrics", 
      "Target audience data",
      "Competitive landscape analysis"
    ],
    protocol_steps: [
      "Analyze current state and identify optimization opportunities",
      "Design strategic framework tailored to business model",
      "Implement systematic testing and measurement protocols",
      "Execute iterative improvements based on data insights",
      "Scale successful patterns across business operations"
    ],
    antipatterns: [
      "Generic advice without business context",
      "Surface-level tactics without strategic foundation",
      "One-size-fits-all approaches"
    ],
    rapid_test: `Does this provide actionable ${category} insights?`,
    extensions: [`Advanced ${category} automation`],
    meaning_layers: [category, 'ecommerce_optimization'],
    anti_surface_features: ['generic_advice_blocking'],
    use_cases: ['ecommerce_optimization', 'conversion_improvement'],
    pricing_tier: 'advanced',
    base_price_cents: 8900
  };
}

// GENERATE BATCH
async function generateBatch() {
  console.log('🚀 Generating frameworks...');
  
  const categories = [
    'conversion_optimization',
    'pricing_psychology',
    'customer_retention', 
    'product_positioning',
    'sales_funnel_engineering'
  ];
  
  const frameworks = [];
  
  for (let i = 0; i < 25; i++) {
    const category = categories[i % categories.length];
    frameworks.push(generateFramework(category, i + 1));
  }
  
  console.log(`💾 Inserting ${frameworks.length} frameworks...`);
  
  const { data, error } = await supabase
    .from('cognitive_frameworks')
    .insert(frameworks);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('🎉 Success! Frameworks inserted.');
}

generateBatch().catch(console.error);