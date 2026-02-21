import { Currency } from './Tenant';

export interface Service {
  id: string; // UUID
  tenantId: string; // UUID
  nameTranslatable: Record<string, string>; // e.g. { "es": "Corte", "en": "Haircut" }
  descriptionTranslatable?: Record<string, string>; // e.g. { "es": "Corte de pelo moderno...", "en": "Modern haircut..." }
  imageUrl?: string | null;
  durationMinutes: number;
  price: number;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}
