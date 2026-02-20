import { Booking } from '../../domain/entities/Booking';
import { Schedule } from '../../domain/entities/Schedule';
import { Service } from '../../domain/entities/Service';
import { Tenant } from '../../domain/entities/Tenant';
import { ScheduleException } from '../../domain/entities/ScheduleException';

export interface IBookingRepository {
  /**
   * Fetches all bookings for a tenant on a specific date (to check overlaps)
   */
  getBookingsByDate(tenantId: string, date: Date): Promise<Booking[]>;

  /**
   * Fetches the service details (duration, etc.)
   */
  getServiceById(serviceId: string): Promise<Service | null>;

  /**
   * Fetches the tenant details (for slotIntervalMinutes, etc.)
   */
  getTenantById(tenantId: string): Promise<Tenant | null>;

  /**
   * Fetches the general schedules valid for a specific date (evaluates validFrom/validTo and dayOfWeek)
   */
  getTenantSchedulesForDate(tenantId: string, date: Date): Promise<Schedule[]>;

  /**
   * Fetches any schedule exceptions (overrides) for a specific date
   */
  getScheduleExceptionByDate(tenantId: string, date: Date): Promise<ScheduleException[]>;

  /**
   * Persists a newly created booking.
   */
  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking>;
}
