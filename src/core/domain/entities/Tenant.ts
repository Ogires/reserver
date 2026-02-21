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
  reminderHoursPrior?: number;
  reminderTemplateBody?: string | null;
  telegramChatId?: string | null;
  notifyEmailConfirmations?: boolean;
  notifyTelegramConfirmations?: boolean;
  notifyEmailReminders?: boolean;
  notifyTelegramReminders?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
