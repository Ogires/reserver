'use server';

import { CheckAvailabilityUseCase } from '../../core/application/use-cases/CheckAvailabilityUseCase';
import { CreateBookingUseCase } from '../../core/application/use-cases/CreateBookingUseCase';
import { SupabaseBookingRepository } from '../../infrastructure/database/supabase/SupabaseBookingRepository';
import { StripePaymentService } from '../../infrastructure/payments/stripe/StripePaymentService';
import { ResendEmailService } from '../../infrastructure/notifications/resend/ResendEmailService';
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
  const customerId = formData.get('customerId') as string; // Usually from an auth session
  const startTimeIso = formData.get('startTime') as string;

  if (!tenantId || !serviceId || !customerId || !startTimeIso) {
    return { error: 'Missing required fields' };
  }

  let bookingId: string | undefined;
  let service: any;

  try {
    const startTime = new Date(startTimeIso);
    const booking = await createBooking.execute(tenantId, serviceId, customerId, startTime);
    bookingId = booking.id;

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: customer } = await supabase.from('customers').select('email').eq('id', customerId).single();
    
    if (customer?.email && service && bookingId) {
      const emailService = new ResendEmailService(process.env.RESEND_API_KEY);
      await emailService.sendEmail(
        customer.email,
        'Booking Confirmed',
        `<p>Your booking for <strong>${service.nameTranslatable['es'] || 'Service'}</strong> has been confirmed.</p>`
      );
      await repository.updateBooking(bookingId, { confirmationSentAt: new Date() });
    }
  } catch (err: any) {
    console.error('Failed to send free booking confirmation email:', err);
  }

  revalidatePath(`/${tenantSlug}`);
  redirect(`/${tenantSlug}/success`);
}
