'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireTenant } from '../../utils';

export async function disconnectIntegration(provider: string) {
  const { tenant } = await requireTenant();
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      }
    }
  );

  const { error } = await supabase
    .from('tenant_integrations')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('provider', provider);

  if (error) {
    console.error('Failed to disconnect integration:', error);
    throw new Error('Could not disconnect integration');
  }

  revalidatePath('/[locale]/admin/(dashboard)/integrations', 'page');
}
