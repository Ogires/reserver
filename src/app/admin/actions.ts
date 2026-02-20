'use server';

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData): Promise<void> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    redirect('/admin/login?error=Email and Password are required');
  }

  const supabase = await createClient();

  // Disable TS checks for signin since type signature is complex
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      redirect(`/admin/login?message=Almost there! Please check your email inbox to verify your account before signing in.`);
    }
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/admin/dashboard');
}

export async function signup(formData: FormData): Promise<void> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/admin/login?error=Email and Password are required');
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      redirect(`/admin/login?message=Almost there! Please check your email inbox to verify your account before signing in.`);
    }
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  // Assuming Email Confirmations are disabled directly in the Supabase Dashboard,
  // we proceed directly to the onboarding step.
  redirect('/admin/onboarding');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function onboardTenant(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const currency = formData.get('currency') as string;
  const slotIntervalMinutes = parseInt(formData.get('slot_interval_minutes') as string, 10);

  const { error } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      preferred_currency: currency,
      slot_interval_minutes: slotIntervalMinutes,
      default_language: 'es',
      owner_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to onboard tenant", error);
    redirect(`/admin/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/admin/dashboard');
}
