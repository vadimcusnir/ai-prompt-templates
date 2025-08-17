import { NextRequest, NextResponse } from 'next/server';
import { stripe, TIER_PRICES, getTierName, getTierDescription } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { tier, userId } = await request.json();

    if (!tier || !userId) {
      return NextResponse.json(
        { error: 'Missing tier or userId' },
        { status: 400 }
      );
    }

    if (!TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Get user details from Supabase
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `AI-Prompt-Templates ${getTierName(tier)} Tier`,
              description: getTierDescription(tier),
              images: ['https://ai-prompt-templates.com/logo.png'],
            },
            unit_amount: TIER_PRICES[tier as keyof typeof TIER_PRICES],
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      customer_email: user.user.email,
      metadata: {
        userId,
        tier,
        type: 'tier_upgrade',
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}