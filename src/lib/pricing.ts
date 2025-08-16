export type AccessTier = 'explorer' | 'architect' | 'initiate' | 'master'

export const TIER_HIERARCHY: Record<AccessTier, number> = {
  explorer: 1,
  architect: 2,
  initiate: 3,
  master: 4
}

export const PREVIEW_PERCENTAGES: Record<AccessTier, number> = {
  explorer: 20,
  architect: 40,
  initiate: 70,
  master: 100
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
  explorer: { 
    monthly: 0, 
    yearly: 0,
    stripe_monthly: null,
    stripe_yearly: null
  }, // Free tier
  architect: { 
    monthly: 4900, 
    yearly: 49900,
    stripe_monthly: 'price_architect_monthly',
    stripe_yearly: 'price_architect_yearly'
  }, // €49/€499
  initiate: { 
    monthly: 8900, 
    yearly: 89900,
    stripe_monthly: 'price_initiate_monthly',
    stripe_yearly: 'price_initiate_yearly'
  }, // €89/€899  
  master: { 
    monthly: 18900, 
    yearly: 189900,
    stripe_monthly: 'price_master_monthly',
    stripe_yearly: 'price_master_yearly'
  } // €189/€1899
}

/**
 * Bundle pricing configurations
 */
export const BUNDLE_PRICES = {
  beginner: { 
    price: 11900, // €119
    promptCount: 10,
    category: 'foundation',
    title: 'Foundation Bundle',
    description: '10 essential cognitive frameworks for beginners'
  },
  professional: { 
    price: 29900, // €299
    promptCount: 30,
    category: 'advanced',
    title: 'Professional Bundle', 
    description: '30 advanced frameworks for strategic thinking'
  },
  expert: { 
    price: 49900, // €499
    promptCount: 60,
    category: 'expert',
    title: 'Expert Bundle',
    description: '60 expert-level frameworks for cognitive architects'
  }
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
export function formatPrice(cents: number, currency: string = 'EUR'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
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
  return interval === 'monthly' ? priceConfig.stripe_monthly : priceConfig.stripe_yearly
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