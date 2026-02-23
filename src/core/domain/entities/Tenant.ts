export type Currency = 'EUR' | 'USD' | 'GBP';

export interface Tenant {
  id: string; // UUID
  name: string;
  slug: string;
  preferredCurrency: Currency;
  defaultLanguage: string;
  slotIntervalMinutes: number; // NEW
  stripeAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  reminderHoursPrior: number; // e.g., 24 for 24 hours before
  minBookingNoticeHours: number; // e.g., 2 for at least 2 hours' notice
  maxBookingNoticeDays: number; // e.g., 60 for up to 60 days in advance
  
  // Customization
  confirmationTemplateBody?: string | null;
  telegramChatId?: string | null;
  notifyEmailConfirmations?: boolean;
  notifyTelegramConfirmations?: boolean;
  notifyEmailReminders?: boolean;
  notifyTelegramReminders?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
