import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { ResendEmailService } from '../../../../infrastructure/notifications/resend/ResendEmailService';
import { TelegramService } from '../../../../infrastructure/notifications/telegram/TelegramService';

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
        
        // Update the booking status to PAID and set confirmation_sent_at
        const now = new Date();
        const { error, data: updatedBooking } = await supabase
          .from('bookings')
          .update({ status: 'confirmed', confirmation_sent_at: now.toISOString() })
          .eq('id', bookingId)
          .select('*, customers(email, telegram_chat_id), services(name_translatable), tenants(telegram_chat_id)')
          .single();
          
        if (error || !updatedBooking) {
          console.error(`Failed to update booking ${bookingId} status:`, error?.message);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        
        console.log(`Successfully marked booking ${bookingId} as Paid via Stripe Webhook`);

        // Send Confirmation Email
        const customerEmail = updatedBooking.customers?.email;
        const customerTelegramId = updatedBooking.customers?.telegram_chat_id;
        const tenantTelegramId = updatedBooking.tenants?.telegram_chat_id;
        const serviceName = updatedBooking.services?.name_translatable?.['es'] || 'Service';

        const notificationPromises = [];

        if (customerEmail) {
          const emailService = new ResendEmailService(process.env.RESEND_API_KEY);
          notificationPromises.push(
            emailService.sendEmail(
              customerEmail,
              'Booking Confirmed (Paid)',
              `<p>Your payment was successful and your booking for <strong>${serviceName}</strong> is confirmed.</p>`
            )
          );
        }

        // Send Telegram Notifications
        const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN);
        
        if (customerTelegramId) {
          notificationPromises.push(
            telegramService.sendMessage(
              customerTelegramId,
              `✅ <b>Booking Confirmed! (Paid)</b>\n\nYour payment was successful and your appointment for <b>${serviceName}</b> is confirmed.`
            )
          );
        }

        if (tenantTelegramId) {
          notificationPromises.push(
            telegramService.sendMessage(
              tenantTelegramId,
              `📅 <b>New Paid Booking Received!</b>\n\nA new booking for <b>${serviceName}</b> was just paid and confirmed.`
            )
          );
        }

        // Ensure all notifications run concurrently
        await Promise.allSettled(notificationPromises);

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
