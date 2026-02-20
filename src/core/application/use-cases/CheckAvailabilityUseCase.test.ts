import { describe, it, expect, vi } from 'vitest';
import { CheckAvailabilityUseCase } from './CheckAvailabilityUseCase';
import { IBookingRepository } from '../ports/IBookingRepository';
import { Schedule } from '../../domain/entities/Schedule';
import { ScheduleException } from '../../domain/entities/ScheduleException';
import { Service } from '../../domain/entities/Service';
import { Booking } from '../../domain/entities/Booking';
import { Tenant } from '../../domain/entities/Tenant';

describe('CheckAvailabilityUseCase', () => {
  const mockRepository: IBookingRepository = {
    getServiceById: vi.fn(),
    getTenantSchedulesForDate: vi.fn(),
    getBookingsByDate: vi.fn(),
    getTenantById: vi.fn(),
    getScheduleExceptionByDate: vi.fn(),
    createBooking: vi.fn()
  };

  const useCase = new CheckAvailabilityUseCase(mockRepository);

  it('should return available slots based on tenant slot intervals', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z'); // Wednesday
    const serviceId = 's1';
    const tenantId = 't1';

    vi.mocked(mockRepository.getTenantById).mockResolvedValue({
      id: tenantId,
      slotIntervalMinutes: 30
    } as Tenant);

    vi.mocked(mockRepository.getServiceById).mockResolvedValue({
      id: serviceId,
      durationMinutes: 45 // 45 min service, but slots are every 30 mins
    } as Service);

    vi.mocked(mockRepository.getScheduleExceptionByDate).mockResolvedValue([]);

    vi.mocked(mockRepository.getTenantSchedulesForDate).mockResolvedValue([
      { dayOfWeek: 3, openTime: '09:00', closeTime: '11:00' } as Schedule
    ]);

    vi.mocked(mockRepository.getBookingsByDate).mockResolvedValue([]);

    // Act
    const slots = await useCase.execute(tenantId, serviceId, requestedDate);

    // Assert
    // Opens 09:00, closes 11:00, slots every 30 mins.
    // 09:00 (ends 09:45) - fits before 11:00
    // 09:30 (ends 10:15) - fits before 11:00
    // 10:00 (ends 10:45) - fits before 11:00
    // 10:30 (ends 11:15) - DOES NOT FIT (11:15 > 11:00)
    expect(slots).toHaveLength(3); 
    expect(slots[0].startTime.getHours()).toBe(9);
    expect(slots[0].startTime.getMinutes()).toBe(0);
    expect(slots[1].startTime.getHours()).toBe(9);
    expect(slots[1].startTime.getMinutes()).toBe(30);
    expect(slots[2].startTime.getHours()).toBe(10);
    expect(slots[2].startTime.getMinutes()).toBe(0);
  });

  it('should handle exceptions that close the business completely', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z');
    
    vi.mocked(mockRepository.getTenantById).mockResolvedValue({ id: 't1', slotIntervalMinutes: 30 } as Tenant);
    vi.mocked(mockRepository.getServiceById).mockResolvedValue({ id: 's1', durationMinutes: 60 } as Service);
    
    vi.mocked(mockRepository.getScheduleExceptionByDate).mockResolvedValue([
      { isClosed: true } as ScheduleException
    ]);

    // Act
    const slots = await useCase.execute('t1', 's1', requestedDate);

    // Assert
    expect(slots).toHaveLength(0);
  });

  it('should handle exceptions with custom hours', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z');
    
    vi.mocked(mockRepository.getTenantById).mockResolvedValue({ id: 't1', slotIntervalMinutes: 60 } as Tenant);
    vi.mocked(mockRepository.getServiceById).mockResolvedValue({ id: 's1', durationMinutes: 60 } as Service);
    
    vi.mocked(mockRepository.getScheduleExceptionByDate).mockResolvedValue([
      { isClosed: false, openTime: '14:00', closeTime: '16:00' } as ScheduleException
    ]);
    
    // Normal schedule shouldn't be used
    vi.mocked(mockRepository.getTenantSchedulesForDate).mockResolvedValue([
      { openTime: '09:00', closeTime: '12:00' } as Schedule
    ]);
    vi.mocked(mockRepository.getBookingsByDate).mockResolvedValue([]);

    // Act
    const slots = await useCase.execute('t1', 's1', requestedDate);

    // Assert
    expect(slots).toHaveLength(2); // 14:00, 15:00
    expect(slots[0].startTime.getHours()).toBe(14);
    expect(slots[1].startTime.getHours()).toBe(15);
  });

  it('should support split shifts (multiple schedules for same day)', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z');
    
    vi.mocked(mockRepository.getTenantById).mockResolvedValue({ id: 't1', slotIntervalMinutes: 60 } as Tenant);
    vi.mocked(mockRepository.getServiceById).mockResolvedValue({ id: 's1', durationMinutes: 60 } as Service);
    vi.mocked(mockRepository.getScheduleExceptionByDate).mockResolvedValue([]);
    
    vi.mocked(mockRepository.getTenantSchedulesForDate).mockResolvedValue([
      { openTime: '09:00', closeTime: '11:00' } as Schedule,
      { openTime: '16:00', closeTime: '18:00' } as Schedule,
    ]);
    vi.mocked(mockRepository.getBookingsByDate).mockResolvedValue([]);

    // Act
    const slots = await useCase.execute('t1', 's1', requestedDate);

    // Assert
    expect(slots).toHaveLength(4); 
    // 09:00, 10:00, 16:00, 17:00
    expect(slots[0].startTime.getHours()).toBe(9);
    expect(slots[1].startTime.getHours()).toBe(10);
    expect(slots[2].startTime.getHours()).toBe(16);
    expect(slots[3].startTime.getHours()).toBe(17);
  });

  it('should filter out overlapping slots properly', async () => {
    // Arrange
    const requestedDate = new Date('2026-02-25T00:00:00Z');
    
    vi.mocked(mockRepository.getTenantById).mockResolvedValue({ id: 't1', slotIntervalMinutes: 30 } as Tenant);
    vi.mocked(mockRepository.getServiceById).mockResolvedValue({ id: 's1', durationMinutes: 60 } as Service);
    vi.mocked(mockRepository.getScheduleExceptionByDate).mockResolvedValue([]);
    vi.mocked(mockRepository.getTenantSchedulesForDate).mockResolvedValue([
      { openTime: '09:00', closeTime: '11:00' } as Schedule
    ]);

    const bookingStart = new Date(requestedDate);
    bookingStart.setHours(9, 30, 0, 0);
    const bookingEnd = new Date(requestedDate);
    bookingEnd.setHours(10, 30, 0, 0);

    vi.mocked(mockRepository.getBookingsByDate).mockResolvedValue([
      { startTime: bookingStart, endTime: bookingEnd, status: 'confirmed' } as Booking
    ]);

    // Act
    const slots = await useCase.execute('t1', 's1', requestedDate);

    // Assert
    // Available grid attempts:
    // 09:00 -> 10:00 (overlaps with 09:30-10:30)
    // 09:30 -> 10:30 (overlaps entirely)
    // 10:00 -> 11:00 (overlaps with 09:30-10:30)
    expect(slots).toHaveLength(0);
  });
});
