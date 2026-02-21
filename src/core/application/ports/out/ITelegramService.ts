export interface ITelegramService {
  /**
   * Sends a message to a specific Telegram chat ID.
   * @param chatId The Telegram Chat ID (can be user or group)
   * @param message The text message to send
   */
  sendMessage(chatId: string, message: string): Promise<void>;
}
