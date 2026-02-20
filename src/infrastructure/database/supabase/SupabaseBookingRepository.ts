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
        stripe_payment_intent_id: booking.stripePaymentIntentId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating booking: ${error.message}`);
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
