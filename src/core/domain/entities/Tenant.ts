export type Currency = 'EUR' | 'USD' | 'GBP';

export interface Tenant {
  id: string; // UUID
  name: string;
  slug: string;
  preferredCurrency: Currency;
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}
