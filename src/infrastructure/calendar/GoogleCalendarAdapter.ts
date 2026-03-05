import { ICalendarProvider, TimeBlock } from '@/core/application/ports/out/ICalendarProvider';
import { Booking } from '@/core/domain/entities/Booking';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Initialize a supabase client to bypass RLS for internal integrations reading
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class GoogleCalendarAdapter implements ICalendarProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/google/callback`
      : 'http://localhost:3003/api/integrations/google/callback';
  }

  private async getOAuth2Client(tenantId: string) {
    const { data: integration, error } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', 'google_calendar')
      .single();

    if (error || !integration) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.expires_at ? new Date(integration.expires_at).getTime() : undefined,
    });

    // Handle token refresh automatically
    oauth2Client.on('tokens', async (tokens) => {
      const updates: any = {};
      if (tokens.access_token) updates.access_token = tokens.access_token;
      if (tokens.refresh_token) updates.refresh_token = tokens.refresh_token;
      if (tokens.expiry_date) updates.expires_at = new Date(tokens.expiry_date).toISOString();

      await supabase
        .from('tenant_integrations')
        .update(updates)
        .eq('id', integration.id);
    });

    return { oauth2Client, calendarId: integration.calendar_id || 'primary' };
  }

  async getBusyBlocks(tenantId: string, startDate: Date, endDate: Date): Promise<TimeBlock[]> {
    const authData = await this.getOAuth2Client(tenantId);
    if (!authData) return []; // No integration, so no busy blocks from Google

    const { oauth2Client, calendarId } = authData;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      const calendars = response.data.calendars;
      if (!calendars || !calendars[calendarId] || !calendars[calendarId].busy) {
        return [];
      }

      return calendars[calendarId].busy.map((busy) => ({
        start: new Date(busy.start!),
        end: new Date(busy.end!),
        title: 'Busy (Google Calendar)',
      }));
    } catch (error) {
      console.error('Error fetching Google Calendar Free/Busy:', error);
      return []; // Fallback to empty if calendar fetch fails
    }
  }

  async createEvent(tenantId: string, booking: Booking): Promise<string | null> {
    const authData = await this.getOAuth2Client(tenantId);
    if (!authData) return null; // No integration

    const { oauth2Client, calendarId } = authData;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const event = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `Booking: ${booking.id.split('-')[0]}`,
          description: `New booking created via SaaS\nBooking ID: ${booking.id}\nStatus: ${booking.status}\nCustomer ID: ${booking.customerId}`,
          start: {
            dateTime: booking.startTime.toISOString(),
            timeZone: 'UTC', // Google infers the correct timezone
          },
          end: {
            dateTime: booking.endTime.toISOString(),
            timeZone: 'UTC',
          },
        },
      });

      return event.data.id || null;
    } catch (error) {
      console.error('Error creating Google Calendar Event:', error);
      return null;
    }
  }

  async updateEvent(tenantId: string, externalEventId: string, booking: Booking): Promise<void> {
    const authData = await this.getOAuth2Client(tenantId);
    if (!authData) return;

    const { oauth2Client, calendarId } = authData;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      await calendar.events.update({
        calendarId,
        eventId: externalEventId,
        requestBody: {
          summary: `Booking: ${booking.id.split('-')[0]} (${booking.status})`,
          description: `Booking updated.\nBooking ID: ${booking.id}\nStatus: ${booking.status}`,
          start: {
            dateTime: booking.startTime.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: booking.endTime.toISOString(),
            timeZone: 'UTC',
          },
        },
      });
    } catch (error) {
      console.error('Error updating Google Calendar Event:', error);
    }
  }

  async deleteEvent(tenantId: string, externalEventId: string): Promise<void> {
    const authData = await this.getOAuth2Client(tenantId);
    if (!authData) return;

    const { oauth2Client, calendarId } = authData;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      await calendar.events.delete({
        calendarId,
        eventId: externalEventId,
      });
    } catch (error) {
      console.error('Error deleting Google Calendar Event:', error);
    }
  }
}
