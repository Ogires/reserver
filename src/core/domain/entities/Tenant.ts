export type Currency = 'EUR' | 'USD' | 'GBP';

export interface Tenant {
  id: string; // UUID
  name: string;
  slug: string;
  preferredCurrency: Currency;
  defaultLanguage: string;
  slotIntervalMinutes: number; // NEW
  createdAt: Date;
  updatedAt: Date;
}
