import { Booking } from '@/core/domain/entities/Booking';

export interface TimeBlock {
  start: Date;
  end: Date;
  title?: string;
}

export interface ICalendarProvider {
  /**
   * Fetches the busy blocks for a given tenant within a date range.
   */
  getBusyBlocks(tenantId: string, startDate: Date, endDate: Date): Promise<TimeBlock[]>;

  /**
   * Creates an event in the external calendar and returns the external event ID.
   */
  createEvent(tenantId: string, booking: Booking): Promise<string | null>;

  /**
   * Updates an existing event in the external calendar.
   */
  updateEvent(tenantId: string, externalEventId: string, booking: Booking): Promise<void>;

  /**
   * Deletes an event in the external calendar.
   */
  deleteEvent(tenantId: string, externalEventId: string): Promise<void>;
}
