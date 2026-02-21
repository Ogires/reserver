import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { SendBookingRemindersUseCase } from './SendBookingRemindersUseCase';
import { IBookingRepository } from '../ports/IBookingRepository';
import { IEmailService } from '../ports/out/IEmailService';
import { ITelegramService } from '../ports/out/ITelegramService';
import { Booking } from '../../domain/entities/Booking';
import { Tenant } from '../../domain/entities/Tenant';

describe('SendBookingRemindersUseCase', () => {
  let mockRepo: Mocked<IBookingRepository>;
  let mockEmail: Mocked<IEmailService>;
  let mockTelegram: Mocked<ITelegramService>;
  let useCase: SendBookingRemindersUseCase;

  beforeEach(() => {
    mockRepo = {
      getPendingReminders: vi.fn(),
      updateBooking: vi.fn(),
      getTenantById: vi.fn(),
      getCustomerEmail: vi.fn(),
      getCustomerTelegramId: vi.fn(),
      getServiceById: vi.fn(),
      getBookingsByDate: vi.fn(),
      getTenantSchedulesForDate: vi.fn(),
      getScheduleExceptionByDate: vi.fn(),
      createBooking: vi.fn()
    } as any;

    mockEmail = {
      sendEmail: vi.fn(),
    } as any;

    mockTelegram = {
      sendMessage: vi.fn(),
    } as any;

    useCase = new SendBookingRemindersUseCase(mockRepo, mockEmail, mockTelegram);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should send reminders for bookings within reminder time and mark as sent', async () => {
    const defaultTenant: Tenant = {
      id: 'tenant-1',
      name: 'Test Tenant',
      slug: 'test',
      preferredCurrency: 'EUR',
      defaultLanguage: 'es',
      slotIntervalMinutes: 30,
      reminderHoursPrior: 24,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const booking1: Booking = {
      id: 'b-1',
      tenantId: 'tenant-1',
      serviceId: 's-1',
      customerId: 'c-1',
      startTime: new Date('2026-02-21T10:00:00Z'),
      endTime: new Date('2026-02-21T11:00:00Z'),
      status: 'confirmed',
      paymentStatus: 'paid_online',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const booking2: Booking = {
      id: 'b-2',
      tenantId: 'tenant-1',
      serviceId: 's-1',
      customerId: 'c-2',
      startTime: new Date('2026-02-22T06:00:00Z'), // 30h from now
      endTime: new Date('2026-02-22T07:00:00Z'),
      status: 'confirmed',
      paymentStatus: 'paid_local',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRepo.getPendingReminders.mockResolvedValue([booking1, booking2]);
    mockRepo.getTenantById.mockResolvedValue(defaultTenant);
    mockRepo.getCustomerEmail.mockResolvedValue('test@test.com');
    mockRepo.getCustomerTelegramId.mockResolvedValue('123456');
    mockRepo.getServiceById.mockResolvedValue({
      id: 's-1',
      tenantId: 'tenant-1',
      nameTranslatable: { es: 'Test Service' },
      durationMinutes: 60,
      price: 10,
      currency: 'EUR',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await useCase.execute();

    expect(mockEmail.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockEmail.sendEmail).toHaveBeenCalledWith(
      'test@test.com',
      'Reminder: Booking for Test Service',
      '<p>Reminder: Your booking for <strong>Test Service</strong> is coming up soon.</p>'
    );
    expect(mockTelegram.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
      '123456',
      '⏰ <b>Booking Reminder</b>\n\nYour appointment for <b>Test Service</b> is coming up in less than 24 hours.'
    );
    expect(mockRepo.updateBooking).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateBooking).toHaveBeenCalledWith('b-1', { reminderSentAt: new Date('2026-02-21T00:00:00Z') });
  });

  it('should not send email or telegram if toggles are disabled completely', async () => {
    const disabledTenant: Tenant = {
      id: 'tenant-2',
      name: 'Test Tenant 2',
      slug: 'test2',
      preferredCurrency: 'EUR',
      defaultLanguage: 'es',
      slotIntervalMinutes: 30,
      reminderHoursPrior: 24,
      notifyEmailReminders: false,
      notifyTelegramReminders: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const booking: Booking = {
      id: 'b-1',
      tenantId: 'tenant-2',
      serviceId: 's-1',
      customerId: 'c-1',
      startTime: new Date('2026-02-21T10:00:00Z'), // 10h from now (within 24h)
      endTime: new Date('2026-02-21T11:00:00Z'),
      status: 'confirmed',
      paymentStatus: 'paid_online',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRepo.getPendingReminders.mockResolvedValue([booking]);
    mockRepo.getTenantById.mockResolvedValue(disabledTenant);
    
    await useCase.execute();
    
    expect(mockEmail.sendEmail).not.toHaveBeenCalled();
    expect(mockTelegram.sendMessage).not.toHaveBeenCalled();
    
    // But it should STILL mark the booking as processed to prevent infinite loops later if settings change
    expect(mockRepo.updateBooking).toHaveBeenCalledTimes(1);
  });
});
