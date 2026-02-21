import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramService } from './TelegramService';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('TelegramService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetch with correct parameters when token is provided', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, result: {} })
    });

    const service = new TelegramService('dummy-token');
    await service.sendMessage('123456', 'Hello World');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://api.telegram.org/botdummy-token/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: '123456',
        text: 'Hello World',
        parse_mode: 'HTML'
      })
    });
  });

  it('should run in mock mode when no token is provided', async () => {
    const service = new TelegramService(); // No token
    await expect(service.sendMessage('123456', 'Hello World')).resolves.not.toThrow();
    
    // fetch should not have been called
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should throw an error if the Telegram API responds with an error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, description: 'Bad Request: chat not found' })
    });

    const service = new TelegramService('dummy-token');
    
    await expect(service.sendMessage('123456', 'Hello World')).rejects.toThrow('Telegram error: Bad Request: chat not found');
  });
});
