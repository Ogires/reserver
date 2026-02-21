import { IBookingRepository } from '../../../core/application/ports/IBookingRepository';
import { Booking, BookingStatus, PaymentStatus } from '../../../core/domain/entities/Booking';
import { Schedule } from '../../../core/domain/entities/Schedule';
import { ScheduleException } from '../../../core/domain/entities/ScheduleException';
import { Service } from '../../../core/domain/entities/Service';
import { Tenant } from '../../../core/domain/entities/Tenant';
import { supabase } from './supabase-client';

export class SupabaseBookingRepository implements IBookingRepository {
  
  async getBookingsByDate(tenantId: string, date: Date): Promise<Booking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    if (error) {
      throw new Error(`Error fetching bookings: ${error.message}`);
    }

    return (data || []).map(this.mapToBooking);
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !data) return null;
    return this.mapToTenant(data);
  }

  async getTenantSchedulesForDate(tenantId: string, date: Date): Promise<Schedule[]> {
    const targetDayOfWeek = date.getDay(); // 0 = Sunday
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('day_of_week', targetDayOfWeek)
      .lte('valid_from', dateStr)
      .gte('valid_to', dateStr);

    if (error) {
      throw new Error(`Error fetching schedules: ${error.message}`);
    }

    return (data || []).map(this.mapToSchedule);
  }

  async getScheduleExceptionByDate(tenantId: string, date: Date): Promise<ScheduleException[]> {
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('schedule_exceptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('exception_date', dateStr);

    if (error) {
      throw new Error(`Error fetching schedule exceptions: ${error.message}`);
    }

    return (data || []).map(this.mapToScheduleException);
  }

  async getServiceById(serviceId: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToService(data);
  }

  async getCustomerEmail(customerId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('email')
      .eq('id', customerId)
      .single();
    
    if (error || !data) {
      return null;
    }

    return data.email;
  }

  async getCustomerTelegramId(customerId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('telegram_chat_id')
      .eq('id', customerId)
      .single();
    
    if (error || !data) {
      return null;
    }

    return data.telegram_chat_id;
  }

  async updateCustomer(customerId: string, updates: Partial<{ telegramChatId: string }>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.telegramChatId !== undefined) dbUpdates.telegram_chat_id = updates.telegramChatId;

    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
      .from('customers')
      .update(dbUpdates)
      .eq('id', customerId);

    if (error) {
      throw new Error(`Error updating customer: ${error.message}`);
    }
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        tenant_id: booking.tenantId,
        service_id: booking.serviceId,
        customer_id: booking.customerId,
        start_time: booking.startTime.toISOString(),
        end_time: booking.endTime.toISOString(),
        status: booking.status,
        payment_status: booking.paymentStatus,
        stripe_payment_intent_id: booking.stripePaymentIntentId,
        confirmation_sent_at: booking.confirmationSentAt?.toISOString() || null,
        reminder_sent_at: booking.reminderSentAt?.toISOString() || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating booking: ${error.message}`);
    }

    return this.mapToBooking(data);
  }

  async getPendingReminders(now: Date, until: Date): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .is('reminder_sent_at', null)
      .gte('start_time', now.toISOString())
      .lte('start_time', until.toISOString());

    if (error) {
      throw new Error(`Error fetching pending reminders: ${error.message}`);
    }

    return (data || []).map((row) => this.mapToBooking(row));
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.stripePaymentIntentId !== undefined) dbUpdates.stripe_payment_intent_id = updates.stripePaymentIntentId;
    if (updates.confirmationSentAt !== undefined) dbUpdates.confirmation_sent_at = updates.confirmationSentAt?.toISOString() || null;
    if (updates.reminderSentAt !== undefined) dbUpdates.reminder_sent_at = updates.reminderSentAt?.toISOString() || null;

    const { data, error } = await supabase
      .from('bookings')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating booking: ${error.message}`);
    }

    return this.mapToBooking(data);
  }

  // --- Mappers ---

  private mapToBooking(row: any): Booking {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      serviceId: row.service_id,
      customerId: row.customer_id,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      status: row.status as BookingStatus,
      paymentStatus: row.payment_status as PaymentStatus,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      confirmationSentAt: row.confirmation_sent_at ? new Date(row.confirmation_sent_at) : undefined,
      reminderSentAt: row.reminder_sent_at ? new Date(row.reminder_sent_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToSchedule(row: any): Schedule {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      dayOfWeek: row.day_of_week,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      openTime: row.open_time,
      closeTime: row.close_time
    };
  }

  private mapToScheduleException(row: any): ScheduleException {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      exceptionDate: row.exception_date,
      isClosed: row.is_closed,
      openTime: row.open_time,
      closeTime: row.close_time
    };
  }

  private mapToTenant(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      preferredCurrency: row.preferred_currency,
      defaultLanguage: row.default_language,
      slotIntervalMinutes: row.slot_interval_minutes,
      stripeAccountId: row.stripe_account_id,
      stripeOnboardingComplete: row.stripe_onboarding_complete,
      reminderHoursPrior: row.reminder_hours_prior,
      reminderTemplateBody: row.reminder_template,
      telegramChatId: row.telegram_chat_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToService(row: any): Service {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      nameTranslatable: row.name_translatable,
      durationMinutes: row.duration_minutes,
      price: row.price,
      currency: row.currency,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
