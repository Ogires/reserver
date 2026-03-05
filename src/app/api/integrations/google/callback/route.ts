import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const tenantId = searchParams.get('state'); // The tenant_id we passed through the state parameter

  if (!code || !tenantId) {
    return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/google/callback`
      : 'http://localhost:3003/api/integrations/google/callback'
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store in Supabase using upsert logic
    const { error } = await supabase
      .from('tenant_integrations')
      .upsert({
        tenant_id: tenantId,
        provider: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, 
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        calendar_id: 'primary',
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id, provider' });

    if (error) {
      console.error('Error saving integration to DB:', error);
      return NextResponse.json({ error: 'Failed to save integration details to the database' }, { status: 500 });
    }

    // Redirect the user back to the admin dashboard UI
    // To support `next-intl` locales, we will redirect them to a generic locale, or ideally the base root so the middleware redirects them to their correct locale.
    const redirectUrl = new URL(req.url);
    redirectUrl.pathname = '/en/admin/dashboard'; 
    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    console.error('Error exchanging google code:', err);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
  }
}
