export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid_online' | 'paid_local';

export interface Booking {
  id: string; // UUID
  tenantId: string; // UUID
  serviceId: string; // UUID
  customerId: string; // UUID
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
