import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing Stripe signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('Stripe webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        if (session.payment_status === 'paid') {
          const { userId, tier } = session.metadata || {};
          
          if (!userId || !tier) {
            console.error('Missing metadata in webhook:', session.metadata);
            break;
          }

          // Update user tier in Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              tier,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Failed to update user tier:', updateError);
            return NextResponse.json(
              { error: 'Failed to update user tier' },
              { status: 500 }
            );
          }

          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              user_id: userId,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
              amount: session.amount_total,
              currency: session.currency,
              tier,
              status: 'completed',
              created_at: new Date().toISOString()
            });

          if (paymentError) {
            console.error('Failed to create payment record:', paymentError);
          }

          console.log(`Successfully upgraded user ${userId} to tier ${tier}`);
        }
        break;

      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('PaymentIntent failed:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}