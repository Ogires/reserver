'use server';

import { createClient } from '../../../../../utils/supabase/server';
import { requireTenant } from '../../utils';
import { revalidatePath } from 'next/cache';
import { ResendEmailService } from '../../../../../infrastructure/notifications/resend/ResendEmailService';
import { TelegramService } from '../../../../../infrastructure/notifications/telegram/TelegramService';
import { SupabaseBookingRepository } from '../../../../../infrastructure/database/supabase/SupabaseBookingRepository';

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  // Ensuring we only update bookings belonging to this tenant
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .eq('tenant_id', tenant.id);

  if (error) {
    console.error('Failed to update booking status:', error);
    throw new Error(error.message);
  }

  // --- Send Notifications & Sync Calendar ---
  try {
    const { data: bookingDetails } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        start_time,
        end_time,
        external_event_id,
        services ( name_translatable ),
        customers ( id, email, full_name, telegram_chat_id )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingDetails && bookingDetails.customers) {
      const repository = new SupabaseBookingRepository();
      const tenantDetails = await repository.getTenantById(tenant.id);
      
      const customerData = Array.isArray(bookingDetails.customers) ? bookingDetails.customers[0] : bookingDetails.customers;
      const serviceData = Array.isArray(bookingDetails.services) ? bookingDetails.services[0] : bookingDetails.services;

      const serviceName = serviceData?.name_translatable?.['es'] || 'Service';
      const notificationPromises = [];

      // Google Calendar Sync
      try {
        const { GoogleCalendarAdapter } = await import('../../../../../infrastructure/calendar/GoogleCalendarAdapter');
        const calendarAdapter = new GoogleCalendarAdapter();
        
        if (status === 'confirmed') {
          const bookingForCalendar = {
            id: bookingDetails.id,
            status: bookingDetails.status,
            customerId: customerData?.id,
            startTime: new Date(bookingDetails.start_time),
            endTime: new Date(bookingDetails.end_time)
          } as any;
          
          const externalEventId = await calendarAdapter.createEvent(tenant.id, bookingForCalendar);
          if (externalEventId) {
             await supabase.from('bookings').update({ external_event_id: externalEventId }).eq('id', bookingId);
          }
        } else if (status === 'cancelled' && bookingDetails.external_event_id) {
          await calendarAdapter.deleteEvent(tenant.id, bookingDetails.external_event_id);
          await supabase.from('bookings').update({ external_event_id: null }).eq('id', bookingId);
        }
      } catch (calErr) {
        console.error('Failed to sync with Google Calendar:', calErr);
      }

      // Email Notification to Customer
      if (customerData?.email && tenantDetails?.notifyEmailConfirmations !== false) {
        const emailService = new ResendEmailService(process.env.RESEND_API_KEY);
        const statusText = status === 'confirmed' ? 'confirmed' : 'cancelled';
        const subject = `Booking ${status === 'confirmed' ? 'Confirmed' : 'Cancelled'}`;
        const bodyMsg = status === 'confirmed' 
          ? `<p>Hello ${customerData.full_name},</p><p>We are pleased to inform you that your booking for <strong>${serviceName}</strong> has been <strong>confirmed</strong> by the business.</p>`
          : `<p>Hello ${customerData.full_name},</p><p>We regret to inform you that your booking for <strong>${serviceName}</strong> has been <strong>cancelled</strong> by the business.</p>`;

        notificationPromises.push(
          emailService.sendEmail(customerData.email, subject, bodyMsg)
        );
      }

      // Telegram Notification to Customer
      if (customerData?.telegram_chat_id && tenantDetails?.notifyTelegramConfirmations !== false) {
        const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN);
        const statusMsg = status === 'confirmed'
          ? `✅ <b>Booking Confirmed!</b>\n\nYour appointment for <b>${serviceName}</b> has been confirmed by the business.`
          : `❌ <b>Booking Cancelled</b>\n\nYour appointment for <b>${serviceName}</b> has been cancelled by the business.`;
        
        notificationPromises.push(
          telegramService.sendMessage(customerData.telegram_chat_id, statusMsg)
        );
      }

      await Promise.allSettled(notificationPromises);
    }
  } catch (err) {
    console.error('Failed to send status update notifications or sync calendar:', err);
    // Don't throw, the status was already updated successfully
  }

  revalidatePath('/[locale]/admin/(dashboard)/bookings', 'page');
  revalidatePath('/admin/bookings');
}
