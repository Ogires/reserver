import { describe, it, expect, vi } from 'vitest';
import { CheckAvailabilityUseCase } from './CheckAvailabilityUseCase';
import { IBookingRepository } from '../ports/IBookingRepository';
import { Schedule } from '../../domain/entities/Schedule';
import { Service } from '../../domain/entities/Service';
import { Booking } from '../../domain/entities/Booking';

describe('CheckAvailabilityUseCase', () => {
  const mockRepository: IBookingRepository = {
    getServiceById: vi.fn(),
    getTenantSchedule: vi.fn(),
    getBookingsByDate: vi.fn(),
    createBooking: vi.fn()
  };

  const useCase = new CheckAvailabilityUseCase(mockRepository);

  it('should return available slots when there are no bookings', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z'); // Wednesday
    const serviceId = 's1';
    const tenantId = 't1';

    vi.mocked(mockRepository.getServiceById).mockResolvedValue({
      id: serviceId,
      durationMinutes: 60
    } as Service);

    vi.mocked(mockRepository.getTenantSchedule).mockResolvedValue([
      { dayOfWeek: 3, openTime: '09:00', closeTime: '12:00' } as Schedule
    ]);

    vi.mocked(mockRepository.getBookingsByDate).mockResolvedValue([]);

    // Act
    const slots = await useCase.execute(tenantId, serviceId, requestedDate);

    // Assert
    expect(slots).toHaveLength(3); // 9:00, 10:00, 11:00
    expect(slots[0].startTime.getHours()).toBe(9);
    expect(slots[1].startTime.getHours()).toBe(10);
    expect(slots[2].startTime.getHours()).toBe(11);
    expect(slots.every(s => s.available)).toBe(true);
  });

  it('should filter out overlapping slots', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z'); // Wednesday
    const serviceId = 's1';
    const tenantId = 't1';

    vi.mocked(mockRepository.getServiceById).mockResolvedValue({
      id: serviceId,
      durationMinutes: 60
    } as Service);

    vi.mocked(mockRepository.getTenantSchedule).mockResolvedValue([
      { dayOfWeek: 3, openTime: '09:00', closeTime: '12:00' } as Schedule
    ]);

    const existingStart = new Date(requestedDate);
    existingStart.setHours(10, 0, 0, 0);
    const existingEnd = new Date(requestedDate);
    existingEnd.setHours(11, 0, 0, 0);

    vi.mocked(mockRepository.getBookingsByDate).mockResolvedValue([
      {
        startTime: existingStart,
        endTime: existingEnd,
        status: 'confirmed'
      } as Booking
    ]);

    // Act
    const slots = await useCase.execute(tenantId, serviceId, requestedDate);

    // Assert
    expect(slots).toHaveLength(2); // 9:00, 11:00 should be available, 10:00 is taken
    expect(slots[0].startTime.getHours()).toBe(9);
    expect(slots[1].startTime.getHours()).toBe(11);
  });

  it('should allow booking if existing is cancelled', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z'); // Wednesday
    const serviceId = 's1';
    const tenantId = 't1';

    vi.mocked(mockRepository.getServiceById).mockResolvedValue({
      id: serviceId,
      durationMinutes: 60
    } as Service);

    vi.mocked(mockRepository.getTenantSchedule).mockResolvedValue([
      { dayOfWeek: 3, openTime: '09:00', closeTime: '12:00' } as Schedule
    ]);

    const existingStart = new Date(requestedDate);
    existingStart.setHours(10, 0, 0, 0);
    const existingEnd = new Date(requestedDate);
    existingEnd.setHours(11, 0, 0, 0);

    vi.mocked(mockRepository.getBookingsByDate).mockResolvedValue([
      {
        startTime: existingStart,
        endTime: existingEnd,
        status: 'cancelled' // Cancelled booking should not block
      } as Booking
    ]);

    // Act
    const slots = await useCase.execute(tenantId, serviceId, requestedDate);

    // Assert
    expect(slots).toHaveLength(3); // All 3 slots available
  });
});
