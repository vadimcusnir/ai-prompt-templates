'use client';

import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
                          'pk_live_51Kki8DIK7fwtty4oI4nC7mxHcXbea2FcrDrenRvB5SINVFM7p03xileeFw3qmIY6wi8mmrR6cp5J2Tu69a1hMqkX00ppqU39oP';
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default getStripe;