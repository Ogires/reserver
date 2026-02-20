import { Currency } from './Tenant';

export interface Service {
  id: string; // UUID
  tenantId: string; // UUID
  nameTranslatable: Record<string, string>; // e.g. { "es": "Corte", "en": "Haircut" }
  durationMinutes: number;
  price: number;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}
