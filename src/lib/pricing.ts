// Digital root 2 pricing for AI-PROMPTS
export function generatePriceAI(
  cognitiveDepth: number, 
  patternComplexity: number
): number {
  // Base price calculation
  const basePrice = Math.floor((cognitiveDepth * 15) + (patternComplexity * 8));
  
  // Apply digital root 2 constraint (prices ending in 2, 20, 29, 38, 47, 56, 65, 74, 83, 92)
  const digitalRoot2Numbers = [2, 11, 20, 29, 38, 47, 56, 65, 74, 83, 92];
  
  // Find closest valid price
  let finalPrice = basePrice;
  for (let i = 0; i < digitalRoot2Numbers.length; i++) {
    if (basePrice <= digitalRoot2Numbers[i]) {
      finalPrice = digitalRoot2Numbers[i];
      break;
    }
  }
  
  // Ensure within range 29-299€
  if (finalPrice < 29) finalPrice = 29;
  if (finalPrice > 299) finalPrice = 299;
  
  return finalPrice * 100; // Return cents
}

// Subscription tiers for AI-PROMPTS
export const AI_SUBSCRIPTION_TIERS = {
  explorer: { price_cents: 4900, name: 'Explorer', access_level: 1 },
  architect: { price_cents: 8900, name: 'Architect', access_level: 2 },
  initiate: { price_cents: 18900, name: 'Initiate', access_level: 3 },
  master: { price_cents: 29900, name: 'Master', access_level: 4 }
} as const;

// Gating logic
export function gatePreview(tier: string, userTier?: string): number {
  const gatingRules = {
    explorer: 20,
    architect: 40, 
    initiate: 70,
    master: 100
  };
  
  if (!userTier) return 20; // Default preview
  
  const userLevel = AI_SUBSCRIPTION_TIERS[userTier as keyof typeof AI_SUBSCRIPTION_TIERS]?.access_level || 0;
  const requiredLevel = AI_SUBSCRIPTION_TIERS[tier as keyof typeof AI_SUBSCRIPTION_TIERS]?.access_level || 1;
  
  if (userLevel >= requiredLevel) return 100;
  
  return gatingRules[tier as keyof typeof gatingRules] || 20;
}