import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

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

export type UserTier = 'free' | 'architect' | 'initiate' | 'elite';

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

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function isTierAccessible(userTier: UserTier, requiredTier: UserTier): boolean {
  const tierOrder: UserTier[] = ['free', 'architect', 'initiate', 'elite'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
}