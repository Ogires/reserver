import { Booking } from '../../domain/entities/Booking';
import { Schedule } from '../../domain/entities/Schedule';
import { Service } from '../../domain/entities/Service';

export interface IBookingRepository {
  /**
   * Fetches all bookings for a tenant on a specific date (to check overlaps).
   */
  getBookingsByDate(tenantId: string, date: Date): Promise<Booking[]>;
  
  /**
   * Fetches the general weekly schedule for a tenant.
   */
  getTenantSchedule(tenantId: string): Promise<Schedule[]>;
  
  /**
   * Fetches a specific service details.
   */
  getServiceById(serviceId: string): Promise<Service | null>;

  /**
   * Persists a newly created booking.
   */
  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking>;
}
