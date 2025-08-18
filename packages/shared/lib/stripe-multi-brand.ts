import Stripe from 'stripe';
import { BrandId } from '../types/brand';

// Configurații Stripe per brand
export const STRIPE_CONFIGS = {
  'ai-prompt-templates': {
    secretKey: process.env.STRIPE_SECRET_KEY_AI_PROMPT_TEMPLATES!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_AI_PROMPT_TEMPLATES!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_AI_PROMPT_TEMPLATES!,
    priceIds: {
      architect: 'price_ai_architect',
      initiate: 'price_ai_initiate',
      elite: 'price_ai_elite'
    }
  },
  '8vultus': {
    secretKey: process.env.STRIPE_SECRET_KEY_8VULTUS!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_8VULTUS!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_8VULTUS!,
    priceIds: {
      architect: 'price_8v_architect',
      initiate: 'price_8v_initiate',
      elite: 'price_8v_elite'
    }
  }
} as const;

// Creează client Stripe pentru un brand specific
export const createBrandedStripe = (brandId: BrandId): Stripe => {
  const config = STRIPE_CONFIGS[brandId];
  if (!config?.secretKey) {
    throw new Error(`Stripe secret key not configured for brand: ${brandId}`);
  }

  return new Stripe(config.secretKey, {
    apiVersion: '2025-07-30.basil',
    typescript: true,
  });
};

// Obține configurația publică pentru un brand
export const getBrandedStripeConfig = (brandId: BrandId) => {
  const config = STRIPE_CONFIGS[brandId];
  if (!config) {
    throw new Error(`Stripe config not found for brand: ${brandId}`);
  }

  return {
    publishableKey: config.publishableKey,
    webhookSecret: config.webhookSecret,
    priceIds: config.priceIds
  };
};

// Prețuri per brand
export const BRAND_PRICING = {
  'ai-prompt-templates': {
    free: 0,
    architect: 2900, // €29.00
    initiate: 4700,   // €47.00
    elite: 7400       // €74.00
  },
  '8vultus': {
    free: 0,
    architect: 3900, // €39.00
    initiate: 6900,   // €69.00
    elite: 9900       // €99.00
  }
} as const;

// Numele tier-urilor per brand
export const BRAND_TIER_NAMES = {
  'ai-prompt-templates': {
    free: 'Free',
    architect: 'Architect',
    initiate: 'Initiate',
    elite: 'Elite'
  },
  '8vultus': {
    free: 'Free',
    architect: 'Explorer',
    initiate: 'Navigator',
    elite: 'Master'
  }
} as const;

// Descrierile tier-urilor per brand
export const BRAND_TIER_DESCRIPTIONS = {
  'ai-prompt-templates': {
    free: 'Essential cognitive frameworks for beginners',
    architect: 'Advanced frameworks with premium templates',
    initiate: 'Professional-grade content and priority support',
    elite: 'Complete access with exclusive frameworks and 1-on-1 consultations'
  },
  '8vultus': {
    free: 'Basic consciousness mapping tools',
    explorer: 'Advanced mapping frameworks and community access',
    navigator: 'Professional consciousness tools and expert guidance',
    master: 'Elite consciousness mastery with personal mentorship'
  }
} as const;

// Funcții helper pentru prețuri
export function getBrandTierPrice(brandId: BrandId, tier: keyof typeof BRAND_PRICING['ai-prompt-templates']): number {
  return BRAND_PRICING[brandId][tier];
}

export function getBrandTierName(brandId: BrandId, tier: keyof typeof BRAND_TIER_NAMES['ai-prompt-templates']): string {
  return BRAND_TIER_NAMES[brandId][tier];
}

export function getBrandTierDescription(brandId: BrandId, tier: keyof typeof BRAND_TIER_DESCRIPTIONS['ai-prompt-templates']): string {
  return BRAND_TIER_DESCRIPTIONS[brandId][tier];
}

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function isTierAccessible(userTier: string, requiredTier: string): boolean {
  const tierOrder = ['free', 'architect', 'initiate', 'elite'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
}

// Creează checkout session pentru un brand specific
export const createBrandedCheckoutSession = async (
  brandId: BrandId,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) => {
  const stripe = createBrandedStripe(brandId);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      brand_id: brandId,
      ...metadata
    },
  });

  return session;
};

// Webhook handler pentru un brand specific
export const handleBrandedWebhook = async (
  brandId: BrandId,
  body: string,
  signature: string
) => {
  const config = STRIPE_CONFIGS[brandId];
  if (!config?.webhookSecret) {
    throw new Error(`Webhook secret not configured for brand: ${brandId}`);
  }

  const stripe = createBrandedStripe(brandId);
  
  try {
    const event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
    
    // Procesează evenimentul în funcție de tip
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Procesează checkout-ul completat
        console.log(`Checkout completed for brand ${brandId}:`, session.id);
        break;
      
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        // Procesează abonamentul nou creat
        console.log(`Subscription created for brand ${brandId}:`, subscription.id);
        break;
      
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        // Procesează abonamentul actualizat
        console.log(`Subscription updated for brand ${brandId}:`, updatedSubscription.id);
        break;
      
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        // Procesează abonamentul șters
        console.log(`Subscription deleted for brand ${brandId}:`, deletedSubscription.id);
        break;
      
      default:
        console.log(`Unhandled event type for brand ${brandId}:`, event.type);
    }
    
    return event;
  } catch (err) {
    console.error(`Webhook error for brand ${brandId}:`, err);
    throw err;
  }
};
