import { IBookingRepository } from '../ports/IBookingRepository';
import { Booking, BookingStatus, PaymentStatus } from '../../domain/entities/Booking';
import { CheckAvailabilityUseCase } from './CheckAvailabilityUseCase';

export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly checkAvailability: CheckAvailabilityUseCase
  ) {}

  /**
   * Creates a new booking if the requested slot is available.
   */
  public async execute(
    tenantId: string,
    serviceId: string,
    customerId: string,
    requestedStartTime: Date
  ): Promise<Booking> {
    // 1. Verify that the requested slot is actually available
    const availableSlots = await this.checkAvailability.execute(tenantId, serviceId, requestedStartTime);
    
    // Find the specific slot in the available slots returned
    const targetSlot = availableSlots.find(
      slot => slot.startTime.getTime() === requestedStartTime.getTime()
    );

    if (!targetSlot || !targetSlot.available) {
      throw new Error('The requested time slot is not available.');
    }

    // 2. Create the booking object
    const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId,
      serviceId,
      customerId,
      startTime: targetSlot.startTime,
      endTime: targetSlot.endTime,
      status: 'pending' as BookingStatus,
      paymentStatus: 'unpaid' as PaymentStatus,
      stripePaymentIntentId: null
    };

    // 3. Persist the booking
    return await this.bookingRepository.createBooking(newBooking);
  }
}
