'use server';

import { CheckAvailabilityUseCase } from '../../core/application/use-cases/CheckAvailabilityUseCase';
import { CreateBookingUseCase } from '../../core/application/use-cases/CreateBookingUseCase';
import { SupabaseBookingRepository } from '../../infrastructure/database/supabase/SupabaseBookingRepository';
import { StripePaymentService } from '../../infrastructure/payments/stripe/StripePaymentService';
import { ResendEmailService } from '../../infrastructure/notifications/resend/ResendEmailService';
import { TelegramService } from '../../infrastructure/notifications/telegram/TelegramService';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Initialize dependencies
const repository = new SupabaseBookingRepository();
const checkAvailability = new CheckAvailabilityUseCase(repository);
const createBooking = new CreateBookingUseCase(repository, checkAvailability);
const stripeService = new StripePaymentService();

/**
 * Server Action to fetch available slots for a given tenant, service and date.
 */
export async function getAvailableSlotsAction(tenantId: string, serviceId: string, dateIso: string) {
  try {
    const requestedDate = new Date(dateIso);
    const slots = await checkAvailability.execute(tenantId, serviceId, requestedDate);
    
    // We return serializable data to the Client Component
    return {
      success: true,
      slots: slots.map(slot => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        available: slot.available
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Server Action to handle the booking creation and Stripe redirection.
 */
export async function submitBookingAction(formData: FormData) {
  const tenantId = formData.get('tenantId') as string;
  const tenantSlug = formData.get('tenantSlug') as string;
  const serviceId = formData.get('serviceId') as string;
  
  // New Customer Form Details
  const customerName = formData.get('customerName') as string;
  const customerEmail = formData.get('customerEmail') as string;
  const customerPhone = formData.get('customerPhone') as string;
  const startTimeIso = formData.get('startTime') as string;

  if (!tenantId || !serviceId || !customerName || !customerEmail || !startTimeIso) {
    return { error: 'Missing required fields' };
  }

  let bookingId: string | undefined;
  let service: any;
  let customerId: string | undefined;
  let managementToken: string | undefined;

  // Supabase Client for DB operations (Customer resolution + Notifications)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Resolve or Create Customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', customerEmail)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerErr } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone || null
        })
        .select('id')
        .single();

      if (customerErr || !newCustomer) throw new Error('Failed to create customer record');
      customerId = newCustomer.id;
    }

    // 2. Create Booking
    if (!customerId) throw new Error('Failed to resolve customer context');
    
    const startTime = new Date(startTimeIso);
    const booking = await createBooking.execute(tenantId, serviceId, customerId, startTime);
    bookingId = booking.id;

    // Fetch the generated management token
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('management_token')
      .eq('id', bookingId)
      .single();
    
    if (bookingData) {
      managementToken = bookingData.management_token;
    }

    // Fetch service info for Stripe details
    service = await repository.getServiceById(serviceId);
  } catch (error: any) {
    console.error('Booking creation failed in DB:', error.message);
    return { error: 'Failed to create booking' };
  }

  // --- Proceed to Stripe ---
  try {
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${tenantSlug}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${tenantSlug}`;

    if (service && bookingId) {
      // Look up tenant's Stripe Account
      const tenant = await repository.getTenantById(tenantId);
      
      const session = await stripeService.createCheckoutSession(
        service.nameTranslatable['es'] || 'Service',
        service.price,
        service.currency,
        successUrl,
        cancelUrl,
        bookingId,
        tenant?.stripeAccountId || undefined
      );

      if (session.url) {
        // Next.js standard redirect inside Server Action
        redirect(session.url);
      }
    }
  } catch (error: any) {
    console.error('Stripe checkout failed', error);
    return { error: 'Failed to initiate checkout.' };
  }

  // If no Stripe integration activated or free service
  try {
    // Fetch customer details including email and telegram ID
    const { data: customer } = await supabase.from('customers').select('email, telegram_chat_id').eq('id', customerId).single();
    // Fetch tenant to see if they have a telegram chat ID
    const tenantDetails = await repository.getTenantById(tenantId);
    
    const notificationPromises = [];
    
    // Email Confirmation
    if (customer?.email && service && bookingId) {
      if (tenantDetails?.notifyEmailConfirmations !== false) {
        const emailService = new ResendEmailService(process.env.RESEND_API_KEY);
        const manageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/en/${tenantSlug}/booking/${bookingId}/manage?token=${managementToken}`;

        notificationPromises.push(
          emailService.sendEmail(
            customer.email,
            'Booking Confirmed',
            `<p>Your booking for <strong>${service.nameTranslatable['es'] || 'Service'}</strong> has been confirmed.</p>
             <p>If you need to cancel or manage this appointment, please visit: <br/> 
             <a href="${manageUrl}">Manage my booking</a></p>`
          )
        );
      }
      // Always mark as sent to prevent retries or infinite loops, even if toggle is disabled
      notificationPromises.push(
        repository.updateBooking(bookingId, { confirmationSentAt: new Date() })
      );
    }

    // Telegram Notifications
    if (service && bookingId && tenantDetails?.notifyTelegramConfirmations !== false) {
      const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN);
      const serviceName = service.nameTranslatable['es'] || 'Service';
      
      // Notify Customer
      if (customer?.telegram_chat_id) {
        notificationPromises.push(
          telegramService.sendMessage(
            customer.telegram_chat_id,
            `✅ <b>Booking Confirmed!</b>\n\nYour appointment for <b>${serviceName}</b> is confirmed.`
          )
        );
      }

      // Notify Tenant
      if (tenantDetails?.telegramChatId) {
        notificationPromises.push(
          telegramService.sendMessage(
            tenantDetails.telegramChatId,
            `📅 <b>New Booking Received!</b>\n\nA new booking for <b>${serviceName}</b> was just created.`
          )
        );
      }
    }

    // Await all notification promises in parallel to avoid waterfalls
    await Promise.allSettled(notificationPromises);

  } catch (err: any) {
    console.error('Failed to send free booking confirmation notifications:', err);
  }

  revalidatePath(`/${tenantSlug}`);
  redirect(`/${tenantSlug}/success`);
}
