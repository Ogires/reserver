'use server';

import { requireTenant } from '../../utils';
import { createClient } from '../../../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummyKeyForDevelopment', {
  apiVersion: '2026-01-28.clover', // updated to match local installed version
});

export async function createStripeConnectAccount() {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  let stripeAccountId = tenant.stripeAccountId;

  // 1. Create a Connect Account if the Tenant doesn't have one yet
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: tenant.name,
      },
    });
    
    stripeAccountId = account.id;

    // Save the new Stripe Account ID to our database
    const { error } = await supabase
      .from('tenants')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', tenant.id);

    if (error) {
      console.error('Failed to save Stripe Account ID to DB:', error);
      throw new Error('Failed to initialize financial setup');
    }
  }

  // 2. Generate the Onboarding Link
  // The host URL dynamically grabs the current domain where we click the button
  // For safety in dev VS prod, we can pass it implicitly or read headers, but 
  // Next.js actions don't have direct access to 'window'. 
  // A safer approach: read standard VERCEL_URL or NEXT_PUBLIC_SITE_URL
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const returnUrl = `${appUrl}/api/stripe/connect/return`;
  const refreshUrl = `${appUrl}/admin/dashboard`;

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  // 3. Redirect user to Stripe Hosted Onboarding
  redirect(accountLink.url);
}
