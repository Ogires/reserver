import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleCalendarAdapter } from './GoogleCalendarAdapter';
import { Booking } from '@/core/domain/entities/Booking';

// Mock googleapis
const mockFreebusyQuery = vi.fn();
const mockEventsInsert = vi.fn();
const mockEventsUpdate = vi.fn();
const mockEventsDelete = vi.fn();

vi.mock('googleapis', () => {
  class MockOAuth2 {
    setCredentials = vi.fn();
    on = vi.fn();
  }

  return {
    google: {
      auth: {
        OAuth2: MockOAuth2,
      },
      calendar: vi.fn(() => ({
        freebusy: { query: mockFreebusyQuery },
        events: {
          insert: mockEventsInsert,
          update: mockEventsUpdate,
          delete: mockEventsDelete,
        },
      })),
    },
  };
});

// Mock supabase client used at module level
export const mockSupabaseSingle = vi.fn();
const supabaseChain: any = {};
supabaseChain.select = vi.fn().mockReturnValue(supabaseChain);
supabaseChain.eq = vi.fn().mockReturnValue(supabaseChain);
supabaseChain.single = mockSupabaseSingle;

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => supabaseChain),
  })),
}));

describe('GoogleCalendarAdapter', () => {
  let adapter: GoogleCalendarAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new GoogleCalendarAdapter();
  });

  describe('getBusyBlocks', () => {
    it('should return empty array when no integration exists', async () => {
      // No integration found in DB
      mockSupabaseSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const blocks = await adapter.getBusyBlocks('t1', new Date(), new Date());
      expect(blocks).toEqual([]);
    });

    it('should return mapped busy blocks on successful query', async () => {
      // Integration exists
      mockSupabaseSingle.mockResolvedValue({
        data: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_at: null,
          calendar_id: 'primary',
        },
        error: null,
      });

      const busyStart = '2026-02-24T10:00:00Z';
      const busyEnd = '2026-02-24T11:00:00Z';

      mockFreebusyQuery.mockResolvedValue({
        data: {
          calendars: {
            primary: {
              busy: [{ start: busyStart, end: busyEnd }],
            },
          },
        },
      });

      const blocks = await adapter.getBusyBlocks(
        't1',
        new Date('2026-02-24T00:00:00Z'),
        new Date('2026-02-24T23:59:59Z')
      );

      expect(blocks).toHaveLength(1);
      expect(blocks[0].start).toEqual(new Date(busyStart));
      expect(blocks[0].end).toEqual(new Date(busyEnd));
      expect(blocks[0].title).toBe('Busy (Google Calendar)');
    });

    it('should return empty array and not throw on calendar API error', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { access_token: 'token', refresh_token: 'refresh', calendar_id: 'primary' },
        error: null,
      });

      mockFreebusyQuery.mockRejectedValue(new Error('API quota exceeded'));

      const blocks = await adapter.getBusyBlocks('t1', new Date(), new Date());
      expect(blocks).toEqual([]);
    });
  });

  describe('createEvent', () => {
    const mockBooking: Booking = {
      id: 'b1-uuid-test',
      tenantId: 't1',
      serviceId: 's1',
      customerId: 'c1',
      startTime: new Date('2026-02-24T10:00:00Z'),
      endTime: new Date('2026-02-24T10:45:00Z'),
      status: 'confirmed',
      paymentStatus: 'paid_online',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return null when no integration exists', async () => {
      mockSupabaseSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const eventId = await adapter.createEvent('t1', mockBooking);
      expect(eventId).toBeNull();
    });

    it('should return the event ID on successful creation', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { access_token: 'token', refresh_token: 'refresh', calendar_id: 'primary' },
        error: null,
      });

      mockEventsInsert.mockResolvedValue({ data: { id: 'gcal_event_123' } });

      const eventId = await adapter.createEvent('t1', mockBooking);
      expect(eventId).toBe('gcal_event_123');
    });
  });
});
