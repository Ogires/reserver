import Link from 'next/link';
import { signout } from './actions';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex selection:bg-indigo-500/30 text-slate-300 font-sans">
      
      {/* Decorative Global Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[150px] rounded-full mix-blend-screen -translate-y-1/2 translate-x-1/3" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/60 flex flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 content-center">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-sky-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] mr-3" />
          <span className="text-lg font-bold text-white tracking-tight">Bookable Admin</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <SidebarLink href="/admin/dashboard" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6">
            Dashboard
          </SidebarLink>
          <SidebarLink href="/admin/bookings" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z">
            Bookings
          </SidebarLink>
          <SidebarLink href="/admin/services" icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
            Services
          </SidebarLink>
          <SidebarLink href="/admin/schedules" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z">
            Schedules & Hours
          </SidebarLink>
          <div className="pt-4 mt-4 border-t border-slate-800/60">
            <SidebarLink href="/admin/settings" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" extraIcon="M15 12a3 3 0 11-6 0 3 3 0 016 0z">
              Business Settings
            </SidebarLink>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800/60">
          <form action={signout}>
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800/50 hover:text-white transition-colors group">
              <svg className="w-5 h-5 mr-3 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="十七 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        <header className="h-16 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-md border-b border-slate-800/60">
          <div className="flex items-center">
            {/* Contextual Header can be injected here by pages */}
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
              <div className="w-full h-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                AD
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, extraIcon, children }: { href: string; icon: string; extraIcon?: string; children: React.ReactNode }) {
  // Normally we would use usePathname() to determine active state, 
  // but this is a Server Component, so we let the generic style apply for now.
  return (
    <Link 
      href={href}
      className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white group transition-colors"
    >
      <svg className="w-5 h-5 mr-3 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        {extraIcon && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={extraIcon} />}
      </svg>
      {children}
    </Link>
  );
}
