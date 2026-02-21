import { ITelegramService } from '../../../core/application/ports/out/ITelegramService';

export class TelegramService implements ITelegramService {
  private botToken: string | null;
  private apiUrl: string;

  constructor(botToken?: string) {
    this.botToken = botToken || null;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    
    if (!this.botToken) {
      console.warn('TelegramService: No Bot Token provided, running in mock mode. Messages will not be sent.');
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.botToken) {
      console.log(`[MOCK TELEGRAM] To Chat: ${chatId} | Message: ${message}`);
      return;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML' // Optional, allows basic HTML formatting in messages
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        console.error('Failed to send Telegram message:', data);
        throw new Error(`Telegram error: ${data.description || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error('Error in TelegramService:', e);
      throw e;
    }
  }
}
