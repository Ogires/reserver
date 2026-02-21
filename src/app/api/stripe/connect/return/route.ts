import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummyKeyForDevelopment', {
  apiVersion: '2026-01-28.clover',
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Identify which Tenant they own
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, stripe_account_id, stripe_onboarding_complete')
      .eq('owner_id', user.id)
      .single();

    if (!tenant || !tenant.stripe_account_id) {
      return NextResponse.redirect(new URL('/admin/dashboard?error=notenant', request.url));
    }

    // Verify with Stripe API if they actually finished onboarding
    // Connect expressive accounts have 'details_submitted' boolean
    const account = await stripe.accounts.retrieve(tenant.stripe_account_id);

    if (account.details_submitted) {
      await supabase
        .from('tenants')
        .update({ stripe_onboarding_complete: true })
        .eq('id', tenant.id);

      return NextResponse.redirect(new URL('/admin/dashboard?success=stripe_connected', request.url));
    } else {
      return NextResponse.redirect(new URL('/admin/dashboard?error=stripe_incomplete', request.url));
    }

  } catch (error) {
    console.error('Stripe Connect Return Error:', error);
    return NextResponse.redirect(new URL('/admin/dashboard?error=stripe_server_error', request.url));
  }
}
