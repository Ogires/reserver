import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseBookingRepository } from './SupabaseBookingRepository';

// Mock supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockIs = vi.fn();
const mockSingle = vi.fn();

// Build a chainable mock
function createChainMock() {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn();
  return chain;
}

let currentChain: ReturnType<typeof createChainMock>;

vi.mock('./supabase-client', () => ({
  supabase: {
    from: vi.fn(() => {
      currentChain = createChainMock();
      return currentChain;
    }),
  },
}));

describe('SupabaseBookingRepository', () => {
  let repo: SupabaseBookingRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SupabaseBookingRepository();
  });

  describe('Mapper: mapToBooking', () => {
    it('should correctly map snake_case DB row to camelCase Booking entity', async () => {
      const dbRow = {
        id: 'b1',
        tenant_id: 't1',
        service_id: 's1',
        customer_id: 'c1',
        start_time: '2026-02-24T10:00:00.000Z',
        end_time: '2026-02-24T10:45:00.000Z',
        status: 'confirmed',
        payment_status: 'paid_online',
        stripe_payment_intent_id: 'pi_123',
        external_event_id: 'gcal_456',
        confirmation_sent_at: '2026-02-24T09:00:00.000Z',
        reminder_sent_at: null,
        created_at: '2026-02-20T08:00:00.000Z',
        updated_at: '2026-02-24T10:00:00.000Z',
      };

      // Use getBookingsByDate which calls mapToBooking internally
      currentChain = createChainMock();
      const { supabase } = await import('./supabase-client');
      vi.mocked(supabase.from).mockReturnValue(currentChain);
      currentChain.lte.mockResolvedValue({ data: [dbRow], error: null });

      const bookings = await repo.getBookingsByDate('t1', new Date(2026, 1, 24));

      expect(bookings).toHaveLength(1);
      const booking = bookings[0];
      expect(booking.id).toBe('b1');
      expect(booking.tenantId).toBe('t1');
      expect(booking.serviceId).toBe('s1');
      expect(booking.customerId).toBe('c1');
      expect(booking.startTime).toBeInstanceOf(Date);
      expect(booking.endTime).toBeInstanceOf(Date);
      expect(booking.status).toBe('confirmed');
      expect(booking.paymentStatus).toBe('paid_online');
      expect(booking.stripePaymentIntentId).toBe('pi_123');
      expect(booking.externalEventId).toBe('gcal_456');
      expect(booking.confirmationSentAt).toBeInstanceOf(Date);
      expect(booking.reminderSentAt).toBeUndefined();
    });
  });

  describe('Mapper: mapToTenant', () => {
    it('should correctly map DB row to Tenant with defaults', async () => {
      const dbRow = {
        id: 't1',
        name: 'Test Salon',
        slug: 'test-salon',
        preferred_currency: 'EUR',
        default_language: 'es',
        slot_interval_minutes: 30,
        stripe_account_id: null,
        stripe_onboarding_complete: false,
        reminder_hours_prior: 24,
        reminder_template: null,
        telegram_chat_id: '12345',
        notify_email_confirmations: true,
        notify_telegram_confirmations: false,
        notify_email_reminders: true,
        notify_telegram_reminders: false,
        min_booking_notice_hours: 4,
        max_booking_notice_days: 30,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-02-01T00:00:00.000Z',
      };

      currentChain = createChainMock();
      const { supabase } = await import('./supabase-client');
      vi.mocked(supabase.from).mockReturnValue(currentChain);
      currentChain.single.mockResolvedValue({ data: dbRow, error: null });

      const tenant = await repo.getTenantById('t1');

      expect(tenant).not.toBeNull();
      expect(tenant!.id).toBe('t1');
      expect(tenant!.name).toBe('Test Salon');
      expect(tenant!.slug).toBe('test-salon');
      expect(tenant!.preferredCurrency).toBe('EUR');
      expect(tenant!.slotIntervalMinutes).toBe(30);
      expect(tenant!.stripeAccountId).toBeNull();
      expect(tenant!.stripeOnboardingComplete).toBe(false);
      expect(tenant!.telegramChatId).toBe('12345');
      expect(tenant!.notifyTelegramConfirmations).toBe(false);
      expect(tenant!.minBookingNoticeHours).toBe(4);
      expect(tenant!.maxBookingNoticeDays).toBe(30);
    });
  });

  describe('Mapper: mapToService', () => {
    it('should correctly map DB row to Service entity', async () => {
      const dbRow = {
        id: 's1',
        tenant_id: 't1',
        name_translatable: { es: 'Corte', en: 'Haircut' },
        duration_minutes: 45,
        price: 25.0,
        currency: 'EUR',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-02-01T00:00:00.000Z',
      };

      currentChain = createChainMock();
      const { supabase } = await import('./supabase-client');
      vi.mocked(supabase.from).mockReturnValue(currentChain);
      currentChain.single.mockResolvedValue({ data: dbRow, error: null });

      const service = await repo.getServiceById('s1');

      expect(service).not.toBeNull();
      expect(service!.id).toBe('s1');
      expect(service!.tenantId).toBe('t1');
      expect(service!.nameTranslatable).toEqual({ es: 'Corte', en: 'Haircut' });
      expect(service!.durationMinutes).toBe(45);
      expect(service!.price).toBe(25.0);
      expect(service!.currency).toBe('EUR');
    });
  });

  describe('Mapper: mapToSchedule and mapToScheduleException', () => {
    it('should correctly map schedule DB rows', async () => {
      const dbRow = {
        id: 'sch1',
        tenant_id: 't1',
        day_of_week: 1,
        valid_from: '2026-01-01',
        valid_to: '2026-12-31',
        open_time: '09:00',
        close_time: '18:00',
      };

      currentChain = createChainMock();
      const { supabase } = await import('./supabase-client');
      vi.mocked(supabase.from).mockReturnValue(currentChain);
      currentChain.lte.mockReturnValue(currentChain);
      currentChain.gte.mockResolvedValue({ data: [dbRow], error: null });

      const schedules = await repo.getTenantSchedulesForDate('t1', new Date(2026, 0, 5)); // Monday

      expect(schedules).toHaveLength(1);
      expect(schedules[0].dayOfWeek).toBe(1);
      expect(schedules[0].openTime).toBe('09:00');
      expect(schedules[0].closeTime).toBe('18:00');
      expect(schedules[0].validFrom).toBe('2026-01-01');
    });

    it('should correctly map schedule exception DB rows', async () => {
      const dbRow = {
        id: 'ex1',
        tenant_id: 't1',
        exception_date: '2026-12-25',
        is_closed: true,
        open_time: null,
        close_time: null,
      };

      currentChain = createChainMock();
      const { supabase } = await import('./supabase-client');
      vi.mocked(supabase.from).mockReturnValue(currentChain);
      currentChain.eq
        .mockReturnValueOnce(currentChain)
        .mockResolvedValueOnce({ data: [dbRow], error: null });

      const exceptions = await repo.getScheduleExceptionByDate('t1', new Date(2026, 11, 25));

      expect(exceptions).toHaveLength(1);
      expect(exceptions[0].isClosed).toBe(true);
      expect(exceptions[0].exceptionDate).toBe('2026-12-25');
    });
  });

  describe('Error handling', () => {
    it('should throw an error when supabase returns an error on getBookingsByDate', async () => {
      currentChain = createChainMock();
      const { supabase } = await import('./supabase-client');
      vi.mocked(supabase.from).mockReturnValue(currentChain);
      currentChain.lte.mockResolvedValue({ data: null, error: { message: 'DB connection failed' } });

      await expect(repo.getBookingsByDate('t1', new Date()))
        .rejects.toThrow('Error fetching bookings: DB connection failed');
    });
  });
});
