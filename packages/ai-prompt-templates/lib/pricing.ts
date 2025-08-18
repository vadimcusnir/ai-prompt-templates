export type AccessTier = 'free' | 'architect' | 'initiate' | 'elite'

export const TIER_HIERARCHY: Record<AccessTier, number> = {
  free: 0,
  architect: 1,
  initiate: 2,
  elite: 3
}

export const PREVIEW_PERCENTAGES: Record<AccessTier, number> = {
  free: 10,
  architect: 40,
  initiate: 70,
  elite: 100
}

/**
 * Calculate digital root of a number
 */
export function calculateDigitalRoot(num: number): number {
  while (num >= 10) {
    num = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0)
  }
  return num
}

/**
 * Generate price for AI prompts using digital root 2 logic
 */
export function generatePriceAI(
  cognitiveDepth: number, // 1-10
  patternComplexity: number // 1-5
): number {
  // Base calculation
  const basePrice = (cognitiveDepth * 15) + (patternComplexity * 20)
  
  // Find nearest price with digital root 2 in range 29-299
  let targetPrice = Math.max(29, Math.min(299, basePrice))
  
  // Adjust to get digital root 2
  while (calculateDigitalRoot(targetPrice) !== 2 && targetPrice <= 299) {
    targetPrice++
  }
  
  // If we exceeded 299, work backwards
  if (targetPrice > 299) {
    targetPrice = 299
    while (calculateDigitalRoot(targetPrice) !== 2 && targetPrice >= 29) {
      targetPrice--
    }
  }
  
  return targetPrice * 100 // Convert to cents
}

/**
 * Subscription pricing (monthly/yearly in cents)
 */
export const SUBSCRIPTION_PRICES = {
  free: { monthly: 0, yearly: 0 }, // Free tier
  architect: { monthly: 2900, yearly: 29000 }, // €29/€290
  initiate: { monthly: 4700, yearly: 47000 }, // €47/€470  
  elite: { monthly: 7400, yearly: 74000 } // €74/€740
}

/**
 * Bundle pricing configurations
 */
export const BUNDLE_PRICES = {
  beginner: { price: 11900, promptCount: 10 }, // €119
  professional: { price: 29900, promptCount: 30 }, // €299
  expert: { price: 49900, promptCount: 60 } // €499
}

// Tier pricing mapping based on digital root 2 algorithm
export const TIER_PRICES = {
  free: 0, // €0.00 - Free tier
  architect: 2900, // €29.00 in cents - digital root 2 (2+9=11, 1+1=2)
  initiate: 4700, // €47.00 in cents - digital root 2 (4+7=11, 1+1=2)  
  elite: 7400, // €74.00 in cents - digital root 2 (7+4=11, 1+1=2)
} as const;

export const TIER_NAMES = {
  free: 'Free',
  architect: 'Architect', 
  initiate: 'Initiate',
  elite: 'Elite',
} as const;

export const TIER_DESCRIPTIONS = {
  free: 'Essential cognitive frameworks for beginners',
  architect: 'Advanced frameworks with premium templates',
  initiate: 'Professional-grade content and priority support',
  elite: 'Complete access with exclusive frameworks and 1-on-1 consultations',
} as const;

export const TIER_FEATURES = {
  free: [
    '10% din librăria completă',
    'Framework-uri de bază',
    'Community Access',
    'Email Support'
  ],
  architect: [
    '40% din librăria completă',
    '200+ Advanced Frameworks',
    'Interactive Templates',
    'Priority Community Access',
    'Video Tutorials',
    'Advanced Search & Filters'
  ],
  initiate: [
    '70% din librăria completă',
    '500+ Professional Frameworks',
    'Custom Template Builder',
    'VIP Community Access',
    'Live Workshops',
    'Priority Support',
    'Framework Analytics'
  ],
  elite: [
    '100% din librăria completă',
    'Exclusive Elite Content',
    'Personal AI Assistant Integration',
    '1-on-1 Consultation Sessions',
    'Custom Framework Development',
    'White-label Solutions',
    'API Access'
  ],
} as const;

export type UserTier = keyof typeof TIER_PRICES;

export function getTierPrice(tier: UserTier): number {
  return TIER_PRICES[tier];
}

export function getTierName(tier: UserTier): string {
  return TIER_NAMES[tier];
}

export function getTierDescription(tier: UserTier): string {
  return TIER_DESCRIPTIONS[tier];
}

export function getTierFeatures(tier: UserTier): readonly string[] {
  return TIER_FEATURES[tier];
}

/**
 * Check if user can access prompt based on tier
 */
export function canAccessPrompt(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]
}

/**
 * Get accessible content based on user tier
 */
export function getAccessibleContent(
  fullContent: string,
  userTier: AccessTier,
  requiredTier: AccessTier
): { content: string; hasFullAccess: boolean } {
  const hasFullAccess = canAccessPrompt(userTier, requiredTier)
  
  if (hasFullAccess) {
    return { content: fullContent, hasFullAccess: true }
  }

  const previewPercentage = PREVIEW_PERCENTAGES[userTier]
  const words = fullContent.split(' ')
  const previewWordCount = Math.floor(words.length * (previewPercentage / 100))
  const previewContent = words.slice(0, previewWordCount).join(' ')
  
  return { 
    content: previewContent + '...\n\n🔒 **Upgrade your subscription to unlock full content**', 
    hasFullAccess: false 
  }
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate bundle discount percentage
 */
export function calculateBundleDiscount(bundlePrice: number, individualPrices: number[]): number {
  const totalIndividual = individualPrices.reduce((sum, price) => sum + price, 0)
  const discount = ((totalIndividual - bundlePrice) / totalIndividual) * 100
  return Math.round(discount)
}

/**
 * Get Stripe price ID for subscription
 */
export function getStripePriceId(tier: AccessTier, interval: 'monthly' | 'yearly'): string | null {
  const priceConfig = SUBSCRIPTION_PRICES[tier]
  return interval === 'monthly' ? priceConfig.monthly.toString() : priceConfig.yearly.toString()
}

/**
 * Validate digital root 2 constraint
 */
export function validateDigitalRoot2(price: number): boolean {
  return calculateDigitalRoot(price) === 2
}

/**
 * Generate multiple valid prices with digital root 2
 */
export function generateValidPrices(minPrice: number = 29, maxPrice: number = 299): number[] {
  const validPrices: number[] = []
  
  for (let price = minPrice; price <= maxPrice; price++) {
    if (validateDigitalRoot2(price)) {
      validPrices.push(price * 100) // Convert to cents
    }
  }
  
  return validPrices
}