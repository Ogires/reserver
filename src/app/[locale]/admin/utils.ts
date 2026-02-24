import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';

export async function requireTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Find the tenant owned by this user
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (error || !tenant) {
    // If user has no tenant, they must onboard
    redirect('/admin/onboarding');
  }

  return { user, tenant };
}
