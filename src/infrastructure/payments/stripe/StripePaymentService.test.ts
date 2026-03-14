import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripePaymentService } from './StripePaymentService';

// Mock Stripe SDK
const mockPaymentIntentsCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock('stripe', () => {
  return {
    default: class {
      paymentIntents = { create: mockPaymentIntentsCreate };
      checkout = { sessions: { create: mockCheckoutSessionsCreate } };
    },
  };
});

describe('StripePaymentService', () => {
  let service: StripePaymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StripePaymentService();
  });

  describe('createPaymentIntent', () => {
    it('should convert amount to cents and include booking metadata', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({ id: 'pi_test', client_secret: 'cs_test' });

      await service.createPaymentIntent(25.00, 'EUR', 'booking-1');

      expect(mockPaymentIntentsCreate).toHaveBeenCalledTimes(1);
      const params = mockPaymentIntentsCreate.mock.calls[0][0];
      expect(params.amount).toBe(2500); // 25.00 * 100
      expect(params.currency).toBe('eur');
      expect(params.metadata.bookingId).toBe('booking-1');
      expect(params.transfer_data).toBeUndefined();
    });

    it('should include transfer_data when tenantStripeAccountId is provided', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({ id: 'pi_test' });

      await service.createPaymentIntent(30.50, 'USD', 'booking-2', 'acct_tenant123');

      const params = mockPaymentIntentsCreate.mock.calls[0][0];
      expect(params.amount).toBe(3050);
      expect(params.currency).toBe('usd');
      expect(params.transfer_data).toEqual({ destination: 'acct_tenant123' });
    });
  });

  describe('createCheckoutSession', () => {
    it('should create session with correct line items, URLs and metadata', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/test' });

      const result = await service.createCheckoutSession(
        'Premium Haircut',
        25.00,
        'EUR',
        'https://app.com/success',
        'https://app.com/cancel',
        'booking-3'
      );

      expect(result.url).toBe('https://checkout.stripe.com/test');

      const params = mockCheckoutSessionsCreate.mock.calls[0][0];
      expect(params.payment_method_types).toEqual(['card']);
      expect(params.mode).toBe('payment');
      expect(params.success_url).toBe('https://app.com/success');
      expect(params.cancel_url).toBe('https://app.com/cancel');
      expect(params.metadata.bookingId).toBe('booking-3');
      expect(params.line_items[0].price_data.unit_amount).toBe(2500);
      expect(params.line_items[0].price_data.currency).toBe('eur');
      expect(params.line_items[0].price_data.product_data.name).toBe('Premium Haircut');
      expect(params.payment_intent_data).toBeUndefined();
    });

    it('should include payment_intent_data with transfer_data for Connect accounts', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_connect', url: 'https://checkout.stripe.com/connect' });

      await service.createCheckoutSession(
        'Beard Trim',
        10.00,
        'GBP',
        'https://app.com/success',
        'https://app.com/cancel',
        'booking-4',
        'acct_tenant456'
      );

      const params = mockCheckoutSessionsCreate.mock.calls[0][0];
      expect(params.payment_intent_data).toEqual({
        transfer_data: { destination: 'acct_tenant456' },
      });
    });
  });
});
