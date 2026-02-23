import { IBookingRepository } from '../ports/IBookingRepository';
import { Booking } from '../../domain/entities/Booking';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export class CheckAvailabilityUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  public async execute(
    tenantId: string,
    serviceId: string,
    requestedDate: Date
  ): Promise<TimeSlot[]> {
    // 1. Fetch Tenant (for interval) and Service (for duration)
    const [tenant, service] = await Promise.all([
      this.bookingRepository.getTenantById(tenantId),
      this.bookingRepository.getServiceById(serviceId)
    ]);

    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);
    if (!service) throw new Error(`Service ${serviceId} not found.`);

    const intervalMinutes = tenant.slotIntervalMinutes || 30;
    const durationMinutes = service.durationMinutes;
    const minNoticeHours = tenant.minBookingNoticeHours ?? 2;
    const maxNoticeDays = tenant.maxBookingNoticeDays ?? 60;

    const now = new Date();
    
    // Check max booking notice
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + maxNoticeDays);
    maxDate.setHours(23, 59, 59, 999);
    
    if (requestedDate > maxDate) {
      return []; // Date is too far in the future
    }

    // 2. Fetch Exceptions for date
    const exceptions = await this.bookingRepository.getScheduleExceptionByDate(tenantId, requestedDate);
    
    let timeBlocks: { openTime: string, closeTime: string }[] = [];

    if (exceptions.length > 0) {
      // If there's an exception saying it's closed, then closed for the day
      if (exceptions.some(e => e.isClosed)) {
        return [];
      }
      
      // Otherwise, use the exception's custom open/close times
      timeBlocks = exceptions.filter(e => e.openTime && e.closeTime).map(e => ({
        openTime: e.openTime!,
        closeTime: e.closeTime!
      }));
    } else {
      // 3. Fallback to normal schedules for this date
      const schedules = await this.bookingRepository.getTenantSchedulesForDate(tenantId, requestedDate);
      timeBlocks = schedules.map(s => ({
        openTime: s.openTime,
        closeTime: s.closeTime
      }));
    }

    if (timeBlocks.length === 0) {
      return []; // No shifts available today
    }

    // 4. Fetch Bookings for Date
    const bookings = await this.bookingRepository.getBookingsByDate(tenantId, requestedDate);

    // 5. Generate and Filter Slots
    const availableSlots: TimeSlot[] = [];
    
    // Check min booking notice
    const minTime = new Date(now);
    minTime.setHours(minTime.getHours() + minNoticeHours);

    for (const block of timeBlocks) {
      const allSlots = this.generateSlots(requestedDate, block.openTime, block.closeTime, intervalMinutes, durationMinutes);
      const openSlots = allSlots.filter(slot => 
        slot.startTime >= minTime && !this.isOverlapping(slot, bookings)
      );
      availableSlots.push(...openSlots.map(s => ({ ...s, available: true })));
    }

    // Sort slots by time just in case blocks were unordered
    availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return availableSlots;
  }

  private generateSlots(
    date: Date, 
    openTimeStr: string, 
    closeTimeStr: string, 
    intervalMin: number, 
    durationMin: number
  ): { startTime: Date, endTime: Date }[] {
    const slots = [];
    
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

      // If the slot extends past closing time, we stop generating
      if (slotEnd > closeTime) {
        break;
      }

      slots.push({ startTime: slotStart, endTime: slotEnd });
      
      // Move forward by the interval amount (e.g. 15 or 30 mins) instead of full duration
      currentTime.setMinutes(currentTime.getMinutes() + intervalMin);
    }

    return slots;
  }

  private isOverlapping(slot: { startTime: Date, endTime: Date }, bookings: Booking[]): boolean {
    return bookings.some(booking => {
      if (booking.status === 'cancelled') return false;
      return slot.startTime < booking.endTime && slot.endTime > booking.startTime;
    });
  }
}
