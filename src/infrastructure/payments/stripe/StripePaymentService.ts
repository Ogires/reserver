import Stripe from 'stripe';

export class StripePaymentService {
  private stripe: Stripe;

  constructor() {
    // Make sure we have the secret key in env before initializing
    // Fallback to a dummy key to prevent server crash during E2E UI testing
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummyKeyForDevelopment';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2026-01-28.clover' // using recent API version
    });
  }

  /**
   * Creates a PaymentIntent for the booking.
   * Useful when using custom payment flow in frontend instead of Checkout Sessions.
   */
  async createPaymentIntent(amount: number, currency: string, bookingId: string, tenantStripeAccountId?: string) {
    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: currency.toLowerCase(),
      metadata: { bookingId },
    };

    // If implementing Stripe Connect, specify the connected account
    if (tenantStripeAccountId) {
      params.transfer_data = {
        destination: tenantStripeAccountId,
      };
      // For Express/Custom accounts involving application fees
      // params.application_fee_amount = Math.round(amount * 10); // 10% fee
    }

    const paymentIntent = await this.stripe.paymentIntents.create(params);
    return paymentIntent;
  }

  /**
   * Creates a Stripe Checkout Session for easier frontend integration.
   */
  async createCheckoutSession(
    serviceName: string, 
    amount: number, 
    currency: string,
    successUrl: string,
    cancelUrl: string,
    tenantStripeAccountId?: string
  ) {
    const params: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: serviceName,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (tenantStripeAccountId) {
      params.payment_intent_data = {
        transfer_data: {
          destination: tenantStripeAccountId,
        },
      };
    }

    const session = await this.stripe.checkout.sessions.create(params);
    return session;
  }
}
