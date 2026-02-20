import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Note: In Server Actions or Route Handlers, use @supabase/ssr for auth cookies.
// For now, this is a basic client for the repository implementation.
export const supabase = createClient(supabaseUrl, supabaseKey);
