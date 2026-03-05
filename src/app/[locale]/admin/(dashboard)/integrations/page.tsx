import { disconnectIntegration } from './actions';
import { requireTenant } from '../../utils';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function IntegrationsPage() {
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

  // Use the admin's privileges to get integrations
  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenant.id);

  const isGoogleCalendarConnected = integrations?.some(i => i.provider === 'google_calendar');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Integrations</h1>
        <p className="mt-2 text-slate-400">
          Connect third-party tools to synchronize data and streamline your workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Google Calendar Card */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/20 transition-all duration-500" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center p-2.5">
                <svg viewBox="0 0 48 48" className="w-full h-full"><path fill="#4285F4" d="M34,44H14c-5.5,0-10-4.5-10-10V14c0-5.5,4.5-10,10-10h20c5.5,0,10,4.5,10,10v20C44,39.5,39.5,44,34,44z"/><path fill="#34A853" d="M35,27l-5,5l-5-5V17h10V27z"/><path fill="#EA4335" d="M19,27l5,5l5-5V17H19V27z"/><path fill="#FBBC04" d="M24,19l-5,5l5,5V19z"/><path fill="#fff" d="M21,29h6v4h-6V29zM19,25h10v2H19V25zM23,19h2v4h-2V19z"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Google Calendar</h3>
                <p className="text-sm text-slate-400 mt-1">Two-way synchronization</p>
              </div>
            </div>
            
            {isGoogleCalendarConnected ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Connected</span>
              </span>
            ) : (
             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                Not Connected
              </span>
            )}
          </div>

          <div className="mt-6 space-y-4 relative z-10">
            <p className="text-sm text-slate-300 leading-relaxed">
              Automatically block slots when you're busy, and push new bookings directly to your primary Google Calendar.
            </p>

            <div className="pt-4 border-t border-slate-800/60">
              {isGoogleCalendarConnected ? (
                <form action={async () => {
                  'use server';
                  await disconnectIntegration('google_calendar');
                }}>
                  <button className="text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Disconnect Calendar
                  </button>
                </form>
              ) : (
                <a 
                  href="/api/integrations/google/auth"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Connect Calendar
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
