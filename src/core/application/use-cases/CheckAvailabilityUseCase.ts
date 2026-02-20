import { IBookingRepository } from '../ports/IBookingRepository';
import { Booking } from '../../domain/entities/Booking';
import { Schedule } from '../../domain/entities/Schedule';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export class CheckAvailabilityUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  /**
   * Computes available slots for a given date, tenant, and service duration.
   */
  public async execute(
    tenantId: string,
    serviceId: string,
    requestedDate: Date
  ): Promise<TimeSlot[]> {
    // 1. Fetch the service to know its duration
    const service = await this.bookingRepository.getServiceById(serviceId);
    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found.`);
    }

    // 2. Fetch the tenant's schedule to find opening/closing hours for this day of week
    const targetDayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const schedules = await this.bookingRepository.getTenantSchedule(tenantId);
    const daySchedule = schedules.find(s => s.dayOfWeek === targetDayOfWeek);

    if (!daySchedule) {
      // Tenant is closed on this day
      return [];
    }

    // 3. Fetch existing bookings for this tenant on this date
    // (Assume getBookingsByDate returns bookings that overlap with the day)
    const existingBookings = await this.bookingRepository.getBookingsByDate(tenantId, requestedDate);

    // 4. Generate possible slots based on opening/closing time and service duration
    const allSlots = this.generateSlots(requestedDate, daySchedule.openTime, daySchedule.closeTime, service.durationMinutes);

    // 5. Filter out slots that overlap with existing bookings
    const availableSlots = allSlots.filter(slot => !this.isOverlapping(slot, existingBookings));

    return availableSlots.map(slot => ({
      ...slot,
      available: true
    }));
  }

  /**
   * Generates sequential time slots from open to close based on duration.
   */
  private generateSlots(date: Date, openTimeStr: string, closeTimeStr: string, durationMin: number): { startTime: Date, endTime: Date }[] {
    const slots = [];
    
    // Parse 'HH:mm'
    const [openH, openM] = openTimeStr.split(':').map(Number);
    const [closeH, closeM] = closeTimeStr.split(':').map(Number);

    const currentTime = new Date(date);
    currentTime.setHours(openH, openM, 0, 0);

    const closeTime = new Date(date);
    closeTime.setHours(closeH, closeM, 0, 0);

    while (true) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMin);

      if (slotEnd > closeTime) {
        break;
      }

      slots.push({ startTime: slotStart, endTime: slotEnd });
      
      // Move to next slot start time (we assume back-to-back scheduling for simplicity, or 15min intervals)
      // Let's use 15-minute standard increments for starting slots instead of jumping by full duration
      // This allows more flexible fitting. But to keep it simple, we increment by the duration.
      currentTime.setMinutes(currentTime.getMinutes() + durationMin);
    }

    return slots;
  }

  /**
   * Checks if a proposed slot overlaps with any confirmed or pending bookings.
   */
  private isOverlapping(slot: { startTime: Date, endTime: Date }, bookings: Booking[]): boolean {
    return bookings.some(booking => {
      // If booking is cancelled, it doesn't block the slot
      if (booking.status === 'cancelled') return false;

      // Overlap logic: Start A < End B AND End A > Start B
      return slot.startTime < booking.endTime && slot.endTime > booking.startTime;
    });
  }
}
