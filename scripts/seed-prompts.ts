import { createClient } from '@supabase/supabase-js'
import { generatePriceAI } from '../src/lib/pricing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const samplePrompts = [
  {
    title: "Latent Pattern Extraction Framework",
    cognitive_category: "deep_analysis",
    difficulty_tier: "advanced",
    required_tier: "architect",
    preview_content: "Advanced framework for identifying hidden patterns in complex datasets using non-linear analysis techniques. Focuses on extracting meaningful relationships that traditional methods miss.",
    full_content: `# Latent Pattern Extraction Framework

## Context de utilizare
Extract hidden patterns from complex, multi-dimensional datasets where traditional analysis fails. Designed for strategic decision-making and predictive modeling.

## Inputuri obligatorii
[DATASET] - Complex data structure (minimum 3 dimensions)
[PATTERN_TYPE] - Target pattern category (temporal, spatial, behavioral)
[CONFIDENCE_THRESHOLD] - Minimum confidence level (0.7-0.95)

## Protocol
1. **Data Dimensionality Mapping** - Map all data dimensions and their relationships
2. **Non-linear Correlation Analysis** - Apply advanced correlation techniques beyond Pearson
3. **Latent Space Construction** - Build reduced-dimension representation spaces
4. **Pattern Topology Analysis** - Analyze geometric structure of discovered patterns
5. **Cross-validation Filtering** - Validate patterns across multiple data subsets
6. **Confidence Scoring** - Assign reliability scores to each discovered pattern
7. **Interpretation Layer** - Translate mathematical patterns to business insights

## Antipatterns
- Using linear methods for non-linear data
- Ignoring temporal dependencies
- Over-fitting to sample-specific patterns
- Confusing correlation with causation
- Neglecting confidence intervals

## Test Rapid
Apply to known dataset with 3 verified patterns. Framework should identify at least 2 with >0.8 confidence.

## Extensii
- Multi-modal data integration
- Real-time pattern detection
- Ensemble pattern validation`,
    implementation_guide: "Step-by-step technical implementation with code examples and validation methods.",
    use_cases: {
      "financial_analysis": "Market trend prediction",
      "behavioral_analysis": "User pattern detection",
      "operational_optimization": "Process efficiency patterns"
    },
    meta_tags: ["pattern-extraction", "data-analysis", "machine-learning"],
    cognitive_depth_score: 8,
    pattern_complexity: 4,
    meaning_layers: ["mathematical", "semantic", "strategic"],
    anti_surface_features: ["requires-advanced-math", "multi-dimensional-thinking"],
    meta_title: "Advanced Latent Pattern Extraction for Complex Data Analysis",
    meta_description: "Professional framework for extracting hidden patterns from complex datasets using advanced non-linear analysis techniques.",
    keywords: ["pattern extraction", "data analysis", "machine learning", "predictive modeling"]
  },
  {
    title: "Consciousness Mapping Protocol",
    cognitive_category: "consciousness_mapping",
    difficulty_tier: "expert",
    required_tier: "initiate",
    preview_content: "Comprehensive framework for mapping and understanding consciousness states, cognitive processes, and mental models. Enables deep self-awareness and cognitive optimization.",
    full_content: `# Consciousness Mapping Protocol

## Context de utilizare
Map and understand your current consciousness state, cognitive processes, and mental models. Designed for personal development, cognitive optimization, and enhanced self-awareness.

## Inputuri obligatorii
[CURRENT_STATE] - Description of your current mental/emotional state
[FOCUS_AREA] - Specific aspect of consciousness to explore
[TIME_FRAME] - Duration for the mapping session (15-60 minutes)

## Protocol
1. **Baseline Assessment** - Establish current consciousness baseline
2. **Attention Mapping** - Map where your attention naturally flows
3. **Thought Pattern Analysis** - Identify recurring thought patterns
4. **Emotional Landscape Survey** - Map emotional states and triggers
5. **Cognitive Load Measurement** - Assess mental bandwidth and energy
6. **Integration Synthesis** - Connect insights into coherent understanding
7. **Action Planning** - Create specific steps for consciousness optimization

## Antipatterns
- Rushing through the process
- Judging your current state
- Trying to change state during mapping
- Ignoring physical sensations
- Over-analyzing instead of observing

## Test Rapid
Complete one full mapping session and identify 3 specific insights about your consciousness state.

## Extensii
- Long-term consciousness tracking
- Comparative state analysis
- Group consciousness mapping`,
    implementation_guide: "Detailed step-by-step guide with meditation techniques and journaling prompts.",
    use_cases: {
      "personal_development": "Self-awareness enhancement",
      "stress_management": "Mental state optimization",
      "creativity_boost": "Cognitive flow enhancement"
    },
    meta_tags: ["consciousness", "self-awareness", "meditation", "cognitive-optimization"],
    cognitive_depth_score: 7,
    pattern_complexity: 3,
    meaning_layers: ["experiential", "analytical", "intuitive"],
    anti_surface_features: ["requires-meditation-experience", "introspective-nature"],
    meta_title: "Complete Consciousness Mapping Protocol for Self-Awareness",
    meta_description: "Expert-level framework for mapping consciousness states and optimizing cognitive processes through systematic self-observation.",
    keywords: ["consciousness", "self-awareness", "meditation", "cognitive optimization", "mindfulness"]
  },
  {
    title: "Meaning Engineering Framework",
    cognitive_category: "meaning_engineering",
    difficulty_tier: "architect",
    required_tier: "master",
    preview_content: "Advanced framework for engineering meaning, purpose, and significance in complex systems. Combines philosophical depth with practical application for transformative outcomes.",
    full_content: `# Meaning Engineering Framework

## Context de utilizare
Engineer meaning, purpose, and significance in complex systems where traditional approaches fail. Designed for organizational transformation, personal purpose discovery, and systemic change.

## Inputuri obligatorii
[SYSTEM_CONTEXT] - The system requiring meaning engineering
[STAKEHOLDER_NEEDS] - Core needs and values of all stakeholders
[TRANSFORMATION_GOAL] - Desired outcome of the meaning engineering process

## Protocol
1. **Meaning Audit** - Assess current meaning structures and gaps
2. **Stakeholder Value Mapping** - Map core values and meaning needs
3. **Purpose Architecture Design** - Design coherent purpose framework
4. **Meaning Integration Strategy** - Integrate meaning across system levels
5. **Communication Framework** - Create meaning transmission mechanisms
6. **Implementation Roadmap** - Plan systematic meaning implementation
7. **Impact Measurement** - Measure meaning engineering outcomes

## Antipatterns
- Imposing meaning without understanding context
- Ignoring stakeholder diversity
- Creating superficial purpose statements
- Failing to align meaning with action
- Neglecting cultural and historical context

## Test Rapid
Apply to a team or project and achieve 80% stakeholder alignment on purpose and meaning.

## Extensii
- Cross-cultural meaning engineering
- Digital meaning systems
- Meaning sustainability frameworks`,
    implementation_guide: "Comprehensive guide with case studies, templates, and facilitation techniques.",
    use_cases: {
      "organizational_change": "Purpose-driven transformation",
      "team_building": "Shared meaning creation",
      "product_development": "Meaningful product design"
    },
    meta_tags: ["meaning-engineering", "purpose", "transformation", "leadership"],
    cognitive_depth_score: 9,
    pattern_complexity: 5,
    meaning_layers: ["philosophical", "practical", "systemic", "transformative"],
    anti_surface_features: ["requires-leadership-experience", "systemic-thinking"],
    meta_title: "Advanced Meaning Engineering for Systemic Transformation",
    meta_description: "Master-level framework for engineering meaning and purpose in complex systems through systematic value alignment and purpose architecture.",
    keywords: ["meaning engineering", "purpose", "transformation", "leadership", "systemic change"]
  }
]

async function seedPrompts() {
  console.log('Starting to seed prompts...')
  
  for (const prompt of samplePrompts) {
    const price = generatePriceAI(prompt.cognitive_depth_score, prompt.pattern_complexity)
    
    const { data, error } = await supabase
      .from('prompts')
      .insert({
        ...prompt,
        slug: prompt.title.toLowerCase().replace(/\s+/g, '-'),
        base_price_cents: price,
        digital_root: 2,
        is_published: true,
        quality_score: prompt.cognitive_depth_score,
        published_at: new Date().toISOString()
      })
      
    if (error) {
      console.error('Error inserting prompt:', error)
    } else {
      console.log('Inserted prompt:', prompt.title)
    }
  }
  
  console.log('Seeding completed!')
}

// Run the seeding
seedPrompts().catch(console.error)
