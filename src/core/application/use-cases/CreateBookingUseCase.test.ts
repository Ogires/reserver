import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateBookingUseCase } from './CreateBookingUseCase';
import { CheckAvailabilityUseCase, TimeSlot } from './CheckAvailabilityUseCase';
import { IBookingRepository } from '../ports/IBookingRepository';
import { Booking } from '../../domain/entities/Booking';

describe('CreateBookingUseCase', () => {
  const mockRepository: IBookingRepository = {
    getServiceById: vi.fn(),
    getTenantSchedulesForDate: vi.fn(),
    getBookingsByDate: vi.fn(),
    getTenantById: vi.fn(),
    getScheduleExceptionByDate: vi.fn(),
    createBooking: vi.fn(),
    getCustomerEmail: vi.fn(),
    getCustomerTelegramId: vi.fn(),
    updateCustomer: vi.fn(),
    getPendingReminders: vi.fn(),
    updateBooking: vi.fn(),
  };

  const mockCheckAvailability = {
    execute: vi.fn(),
  } as unknown as CheckAvailabilityUseCase;

  const useCase = new CreateBookingUseCase(mockRepository, mockCheckAvailability);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a booking when the requested slot is available', async () => {
    // Arrange
    const requestedStart = new Date(2026, 1, 24, 10, 0, 0);
    const slotEnd = new Date(2026, 1, 24, 10, 45, 0);

    const availableSlots: TimeSlot[] = [
      { startTime: new Date(2026, 1, 24, 9, 0, 0), endTime: new Date(2026, 1, 24, 9, 45, 0), available: true },
      { startTime: requestedStart, endTime: slotEnd, available: true },
      { startTime: new Date(2026, 1, 24, 11, 0, 0), endTime: new Date(2026, 1, 24, 11, 45, 0), available: true },
    ];

    vi.mocked(mockCheckAvailability.execute).mockResolvedValue(availableSlots);

    const createdBooking: Booking = {
      id: 'booking-1',
      tenantId: 't1',
      serviceId: 's1',
      customerId: 'c1',
      startTime: requestedStart,
      endTime: slotEnd,
      status: 'pending',
      paymentStatus: 'unpaid',
      stripePaymentIntentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockRepository.createBooking).mockResolvedValue(createdBooking);

    // Act
    const result = await useCase.execute('t1', 's1', 'c1', requestedStart);

    // Assert
    expect(result).toEqual(createdBooking);
    expect(mockRepository.createBooking).toHaveBeenCalledTimes(1);
    expect(mockRepository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        serviceId: 's1',
        customerId: 'c1',
        startTime: requestedStart,
        endTime: slotEnd,
        status: 'pending',
        paymentStatus: 'unpaid',
      })
    );
  });

  it('should throw an error when the requested slot is not available', async () => {
    // Arrange
    const requestedStart = new Date(2026, 1, 24, 10, 0, 0);

    const availableSlots: TimeSlot[] = [
      { startTime: requestedStart, endTime: new Date(2026, 1, 24, 10, 45, 0), available: false },
    ];

    vi.mocked(mockCheckAvailability.execute).mockResolvedValue(availableSlots);

    // Act & Assert
    await expect(useCase.execute('t1', 's1', 'c1', requestedStart))
      .rejects.toThrow('The requested time slot is not available.');

    expect(mockRepository.createBooking).not.toHaveBeenCalled();
  });

  it('should throw an error when the requested time does not match any slot', async () => {
    // Arrange
    const requestedStart = new Date(2026, 1, 24, 14, 0, 0); // 14:00 — not in the list

    const availableSlots: TimeSlot[] = [
      { startTime: new Date(2026, 1, 24, 9, 0, 0), endTime: new Date(2026, 1, 24, 9, 45, 0), available: true },
      { startTime: new Date(2026, 1, 24, 10, 0, 0), endTime: new Date(2026, 1, 24, 10, 45, 0), available: true },
    ];

    vi.mocked(mockCheckAvailability.execute).mockResolvedValue(availableSlots);

    // Act & Assert
    await expect(useCase.execute('t1', 's1', 'c1', requestedStart))
      .rejects.toThrow('The requested time slot is not available.');

    expect(mockRepository.createBooking).not.toHaveBeenCalled();
  });

  it('should pass correct booking data with null stripePaymentIntentId', async () => {
    // Arrange
    const requestedStart = new Date(2026, 1, 24, 9, 0, 0);
    const slotEnd = new Date(2026, 1, 24, 10, 0, 0);

    vi.mocked(mockCheckAvailability.execute).mockResolvedValue([
      { startTime: requestedStart, endTime: slotEnd, available: true },
    ]);

    const createdBooking: Booking = {
      id: 'booking-2',
      tenantId: 't1',
      serviceId: 's2',
      customerId: 'c2',
      startTime: requestedStart,
      endTime: slotEnd,
      status: 'pending',
      paymentStatus: 'unpaid',
      stripePaymentIntentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(mockRepository.createBooking).mockResolvedValue(createdBooking);

    // Act
    await useCase.execute('t1', 's2', 'c2', requestedStart);

    // Assert — verify the exact shape passed to createBooking
    const callArg = vi.mocked(mockRepository.createBooking).mock.calls[0][0];
    expect(callArg.stripePaymentIntentId).toBeNull();
    expect(callArg.status).toBe('pending');
    expect(callArg.paymentStatus).toBe('unpaid');
  });
});
