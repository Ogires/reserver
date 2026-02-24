import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // First, let next-intl handle localization and routing
  const response = intlMiddleware(request);

  // For Admin paths, update the Supabase session
  if (request.nextUrl.pathname.includes('/admin')) {
    const authResponse = await updateSession(request);
    
    // Merge cookies from Supabase to the final intlResponse
    authResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value);
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
