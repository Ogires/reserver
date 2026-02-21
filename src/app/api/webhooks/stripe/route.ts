import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummyKeyForDevelopment', {
  apiVersion: '2026-01-28.clover',
});

// We need the raw body to verify the Stripe signature
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing stripe signature or webhok secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // Update the booking status to PAID
        // Using Service Role Key bypasses RLS policies ensuring the Webhook works
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'confirmed' }) // or 'paid' if we had a payment_status column
          .eq('id', bookingId);
          
        if (error) {
          console.error(`Failed to update booking ${bookingId} status:`, error.message);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        
        console.log(`Successfully marked booking ${bookingId} as Paid via Stripe Webhook`);
      } catch (dbError) {
        console.error('Database connection failed during webhook:', dbError);
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
      }
    } else {
      console.warn('Checkout Session completed but no bookingId found in metadata');
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
