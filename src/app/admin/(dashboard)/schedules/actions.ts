'use server';

import { createClient } from '../../../../utils/supabase/server';
import { requireTenant } from '../../utils';
import { revalidatePath } from 'next/cache';

// --- General Schedules ---

export async function createSchedule(formData: FormData) {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  const validFrom = formData.get('valid_from') as string;
  const validTo = formData.get('valid_to') as string;
  const dayOfWeek = parseInt(formData.get('day_of_week') as string, 10);
  const openTime = formData.get('open_time') as string;
  const closeTime = formData.get('close_time') as string;

  const { error } = await supabase
    .from('schedules')
    .insert({
      tenant_id: tenant.id,
      day_of_week: dayOfWeek,
      valid_from: validFrom,
      valid_to: validTo,
      open_time: openTime,
      close_time: closeTime
    });

  if (error) {
    console.error('Error creating schedule:', error.message);
    throw new Error(error.message);
  }

  revalidatePath('/admin/schedules');
}

export async function deleteSchedule(scheduleId: string) {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId)
    .eq('tenant_id', tenant.id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/schedules');
}

// --- Schedule Exceptions ---

export async function createException(formData: FormData) {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  const exceptionDate = formData.get('exception_date') as string;
  const isClosed = formData.get('is_closed') === 'true';
  const openTime = formData.get('open_time') as string || null;
  const closeTime = formData.get('close_time') as string || null;

  const { error } = await supabase
    .from('schedule_exceptions')
    .insert({
      tenant_id: tenant.id,
      exception_date: exceptionDate,
      is_closed: isClosed,
      open_time: openTime,
      close_time: closeTime
    });

  if (error) {
    console.error('Error creating exception:', error.message);
    throw new Error(error.message);
  }

  revalidatePath('/admin/schedules');
}

export async function deleteException(exceptionId: string) {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  const { error } = await supabase
    .from('schedule_exceptions')
    .delete()
    .eq('id', exceptionId)
    .eq('tenant_id', tenant.id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/schedules');
}
