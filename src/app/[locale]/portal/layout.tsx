import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // For initials or email prefix
  const displayName = user?.email?.split('@')[0] || '';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center space-x-2">
           <Link href="/portal/dashboard" className="flex items-center space-x-2">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
               <span className="text-white font-bold text-lg leading-none tracking-tighter">P</span>
             </div>
             <span className="text-xl font-bold tracking-tight text-slate-900">Parkloc</span>
           </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/portal/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            My Bookings
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-3 ml-4">
               <form action="/auth/signout" method="post">
                 <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                    Sign out
                 </button>
               </form>
               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 overflow-hidden flex items-center justify-center">
                  {initial}
               </div>
            </div>
          ) : (
             <Link href="/portal/login" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors ml-4">
               Sign In
             </Link>
          )}
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-200 mt-auto bg-white">
        © {new Date().getFullYear()} Parkloc. All rights reserved.
      </footer>
    </div>
  );
}
