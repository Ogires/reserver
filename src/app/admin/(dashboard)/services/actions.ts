'use server';

import { createClient } from '../../../../utils/supabase/server';
import { requireTenant } from '../../utils';
import { revalidatePath } from 'next/cache';

export async function createService(formData: FormData) {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  const nameEs = formData.get('name_es') as string;
  const nameEn = formData.get('name_en') as string;
  const descEs = formData.get('description_es') as string | null;
  const descEn = formData.get('description_en') as string | null;
  const imageUrl = formData.get('image_url') as string | null;
  const duration = parseInt(formData.get('duration_minutes') as string, 10);
  const price = parseFloat(formData.get('price') as string);

  const { error } = await supabase
    .from('services')
    .insert({
      tenant_id: tenant.id,
      name_translatable: { es: nameEs, en: nameEn },
      description_translatable: { es: descEs || '', en: descEn || '' },
      image_url: imageUrl || null,
      duration_minutes: duration,
      price: price,
      currency: tenant.preferred_currency
    });

  if (error) throw new Error(error.message);

  revalidatePath('/admin/services');
}

export async function deleteService(serviceId: string) {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  // Ensuring we only delete services belonging to this tenant
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/services');
}

export async function updateService(serviceId: string, formData: FormData) {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  const nameEs = formData.get('name_es') as string;
  const nameEn = formData.get('name_en') as string;
  const descEs = formData.get('description_es') as string | null;
  const descEn = formData.get('description_en') as string | null;
  const imageUrl = formData.get('image_url') as string | null;
  const duration = parseInt(formData.get('duration_minutes') as string, 10);
  const price = parseFloat(formData.get('price') as string);

  const { error } = await supabase
    .from('services')
    .update({
      name_translatable: { es: nameEs, en: nameEn },
      description_translatable: { es: descEs || '', en: descEn || '' },
      image_url: imageUrl || null,
      duration_minutes: duration,
      price: price
    })
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/services');
}
