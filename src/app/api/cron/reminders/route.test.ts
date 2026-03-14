import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock the dependencies used inside the route
const mockExecute = vi.fn();

vi.mock('../../../../infrastructure/database/supabase/SupabaseBookingRepository', () => ({
  SupabaseBookingRepository: vi.fn(),
}));

vi.mock('../../../../infrastructure/notifications/resend/ResendEmailService', () => ({
  ResendEmailService: vi.fn(),
}));

vi.mock('../../../../infrastructure/notifications/telegram/TelegramService', () => ({
  TelegramService: vi.fn(),
}));

vi.mock('../../../../core/application/use-cases/SendBookingRemindersUseCase', () => {
  return {
    SendBookingRemindersUseCase: class {
      execute = mockExecute;
    }
  };
});

describe('Cron Reminders API Route', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it('should return 401 Unauthorized if no authorization header is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/reminders');
    
    const response = await GET(req);
    
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should return 401 Unauthorized if authorization header is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/reminders', {
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });
    
    const response = await GET(req);
    
    expect(response.status).toBe(401);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should return 200 OK and execute use case on valid authorization', async () => {
    mockExecute.mockResolvedValue(undefined);

    const req = new NextRequest('http://localhost:3000/api/cron/reminders', {
      headers: {
        authorization: 'Bearer test-secret',
      },
    });
    
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, message: 'Reminders processed successfully' });
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('should return 500 Internal Server Error if use case throws an error', async () => {
    mockExecute.mockRejectedValue(new Error('Database failure'));

    const req = new NextRequest('http://localhost:3000/api/cron/reminders', {
      headers: {
        authorization: 'Bearer test-secret',
      },
    });
    
    const response = await GET(req);
    
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Database failure' });
  });
});
