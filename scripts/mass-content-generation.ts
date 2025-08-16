// 📄 FIȘIER: scripts/mass-content-generation.ts
import { generateEcommerceFramework } from './content-generation/prompt-factory';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ECOMMERCE CATEGORII
const ECOMMERCE_CATEGORIES = [
  'conversion_optimization',
  'pricing_psychology', 
  'customer_retention',
  'product_positioning',
  'sales_funnel_engineering',
  'brand_differentiation',
  'market_research',
  'competitor_analysis',
  'growth_hacking',
  'customer_psychology'
];

// PRICING CALCULATOR (Digital Root 2) - FIXED
function calculatePrice(difficultyTier: string, cognitiveDepthScore: number): number {
  const basePrice = difficultyTier === 'foundation' ? 29 : 
                   difficultyTier === 'advanced' ? 89 :
                   difficultyTier === 'expert' ? 149 : 199;
  
  const multiplier = cognitiveDepthScore / 10;
  const finalPrice = Math.round(basePrice * multiplier);
  
  // Ensure digital root 2 - FIXED TypeScript error
  let sum = finalPrice;
  while (sum >= 10) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  
  return sum === 2 ? finalPrice : finalPrice + (2 - sum);
}

// FRAMEWORK GENERATOR
function generateCompleteFramework(category: string, index: number) {
  const baseFramework = generateEcommerceFramework(category, index);
  const difficultyTier = ['foundation', 'advanced', 'expert', 'architect'][Math.floor(Math.random() * 4)];
  const cognitiveDepthScore = Math.floor(Math.random() * 3) + 7; // 7-10 for quality
  
  return {
    ...baseFramework,
    slug: `${category}-framework-${index}`,
    cognitive_category: 'ecommerce_optimization',
    difficulty_tier: difficultyTier,
    required_tier: difficultyTier === 'foundation' ? 'explorer' : 
                   difficultyTier === 'advanced' ? 'architect' :
                   difficultyTier === 'expert' ? 'initiate' : 'master',
    cognitive_depth_score: cognitiveDepthScore,
    pattern_complexity: Math.floor(Math.random() * 3) + 3, // 3-5
    antipatterns: [
      "Generic advice without ecommerce context",
      "Surface-level optimization without psychological insight", 
      "One-size-fits-all approaches ignoring business model",
      "Technical implementation without strategic foundation"
    ],
    rapid_test: `Does this framework provide actionable insights specific to ${category}? Can it be implemented within 24-48 hours?`,
    extensions: [
      `Advanced ${category} automation`,
      `Multi-channel ${category} optimization`,
      `AI-powered ${category} scaling`
    ],
    meaning_layers: [category, 'ecommerce_psychology', 'conversion_science'],
    anti_surface_features: ['generic_advice_blocking', 'surface_optimization_prevention'],
    use_cases: ['ecommerce_optimization', 'conversion_improvement', 'revenue_growth'],
    pricing_tier: difficultyTier,
    base_price_cents: calculatePrice(difficultyTier, cognitiveDepthScore) * 100
  };
}

// MASS GENERATION FUNCTION - FIXED TypeScript error
async function generateAndInsertBatch(count: number = 50) {
  console.log(`🚀 Generating ${count} ecommerce frameworks...`);
  
  const frameworks = [];
  
  for (let i = 0; i < count; i++) {
    const category = ECOMMERCE_CATEGORIES[i % ECOMMERCE_CATEGORIES.length];
    const framework = generateCompleteFramework(category, i + 1);
    frameworks.push(framework);
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ Generated ${i + 1}/${count} frameworks...`);
    }
  }
  
  // Insert în database
  console.log('💾 Inserting into database...');
  
  const { data, error } = await supabase
    .from('cognitive_frameworks')
    .insert(frameworks);
    
  if (error) {
    console.error('❌ Database error:', error);
    return;
  }
  
  console.log(`🎉 Successfully inserted ${count} frameworks!`);
  console.log('📊 Summary:');
  
  // Stats - FIXED TypeScript error cu explicit typing
  const categories: Record<string, number> = frameworks.reduce((acc: Record<string, number>, f) => {
    acc[f.cognitive_category] = (acc[f.cognitive_category] || 0) + 1;
    return acc;
  }, {});
  
  console.table(categories);
}

// RUN GENERATION
if (require.main === module) {
  generateAndInsertBatch(50)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { generateAndInsertBatch };