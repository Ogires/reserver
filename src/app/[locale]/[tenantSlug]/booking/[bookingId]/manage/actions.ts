'use server';

import { createClient } from '../../../../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ResendEmailService } from '../../../../../../infrastructure/notifications/resend/ResendEmailService';
import { TelegramService } from '../../../../../../infrastructure/notifications/telegram/TelegramService';
import { SupabaseBookingRepository } from '../../../../../../infrastructure/database/supabase/SupabaseBookingRepository';

export async function manageCancelBooking(bookingId: string, token: string, tenantSlug: string) {
  if (!bookingId || !token) {
    return { error: 'Invalid link' };
  }

  const supabase = await createClient();

  // First verify the token matches the booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', bookingId)
    .eq('management_token', token)
    .single();

  if (!booking) {
    return { error: 'Invalid or expired management link.' };
  }

  if (booking.status === 'cancelled') {
    return { error: 'Booking is already cancelled.' };
  }

  // Update status
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) {
    return { error: 'Failed to cancel the booking. Please contact the business directly.' };
  }

  // --- Send Notifications ---
  try {
    const { data: bookingDetails } = await supabase
      .from('bookings')
      .select(`
        id,
        tenant_id,
        start_time,
        services ( name_translatable ),
        customers ( email, full_name, telegram_chat_id )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingDetails && bookingDetails.customers && bookingDetails.tenant_id) {
      const repository = new SupabaseBookingRepository();
      const tenantDetails = await repository.getTenantById(bookingDetails.tenant_id);
      
      const customerData = Array.isArray(bookingDetails.customers) ? bookingDetails.customers[0] : bookingDetails.customers;
      const serviceData = Array.isArray(bookingDetails.services) ? bookingDetails.services[0] : bookingDetails.services;

      const serviceName = serviceData?.name_translatable?.['es'] || 'Service';
      const notificationPromises = [];

      // 1. Email to Tenant
      if (tenantDetails?.notifyEmailConfirmations !== false) {
        // Technically this setting was for 'confirmations' but we use it for general booking notifications currently
        // In a real app we'd add a specific email address for the tenant, using a dummy or ignoring for now if we don't have it
        // We will just send it via Telegram to the tenant for now built-in.
      }

      // 2. Telegram to Tenant
      if (tenantDetails?.telegramChatId && tenantDetails?.notifyTelegramConfirmations !== false) {
        const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN);
        notificationPromises.push(
          telegramService.sendMessage(
            tenantDetails.telegramChatId,
            `❌ <b>Cita Cancelada por Cliente</b>\n\nEl cliente <b>${customerData.full_name}</b> ha cancelado su reserva para <b>${serviceName}</b> de forma autónoma.`
          )
        );
      }

      // 3. Email to Customer (Confirmation of cancellation)
      if (customerData?.email && tenantDetails?.notifyEmailConfirmations !== false) {
        const emailService = new ResendEmailService(process.env.RESEND_API_KEY);
        notificationPromises.push(
          emailService.sendEmail(
            customerData.email,
            'Booking Cancellation Confirmed',
            `<p>Hello ${customerData.full_name},</p><p>As requested, your booking for <strong>${serviceName}</strong> has been successfully <strong>cancelled</strong>.</p>`
          )
        );
      }

      await Promise.allSettled(notificationPromises);
    }
  } catch (err) {
    console.error('Failed to send customer self-cancellation notifications:', err);
  }

  revalidatePath(`/[locale]/${tenantSlug}/booking/[bookingId]/manage`, 'page');
  return { success: true };
}
