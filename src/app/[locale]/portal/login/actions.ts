'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/portal/login?message=Could not authenticate user')
  }

  revalidatePath('/portal/dashboard')
  redirect('/portal/dashboard')
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/portal/login?message=Could not authenticate user')
  }
  
  // Create / link the customer record right away
  if (data.user) {
    // Check if customer exists by email (created during guest booking)
    const { data: existingCustomer } = await supabase
       .from('customers')
       .select('id')
       .eq('email', email)
       .single();
       
    if (existingCustomer) {
      // Link the existing customer record to this new auth user
      await supabase
        .from('customers')
        .update({ auth_id: data.user.id })
        .eq('id', existingCustomer.id);
    } else {
      // Create a brand new customer record
      await supabase
        .from('customers')
        .insert({
           email: email,
           full_name: email.split('@')[0], // Placeholder name
           auth_id: data.user.id
        });
    }
  }

  revalidatePath('/portal/dashboard')
  redirect('/portal/dashboard')
}
