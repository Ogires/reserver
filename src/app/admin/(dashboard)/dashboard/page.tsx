import { requireTenant } from '../../utils';
import { createClient } from '../../../../utils/supabase/server';
import { createStripeConnectAccount } from './stripe-actions';

export default async function AdminDashboardPage() {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  // Fetch actual counts
  const { count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id);

  const { count: servicesCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-400 mt-2">Welcome to the <strong className="text-indigo-400">{tenant.name}</strong> administration panel.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Bookings" value={(bookingsCount || 0).toString()} trend="All time" trendUp />
        <StatCard title="Upcoming Revenue" value="---" trend="Pending setup" />
        <StatCard title="Active Services" value={(servicesCount || 0).toString()} trend="Configured" trendUp />
      </div>

      {/* Financial Onboarding Card */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.143-3.356-2.077 0-.806.685-1.353 1.954-1.353 1.621 0 2.871.583 3.999 1.488l1.491-3.692C16.487 2.227 14.542 1.5 12.35 1.5 8.1 1.5 5.3 4.102 5.3 7.61c0 4.293 4.418 5.419 7.644 6.643 2.193.824 3.018 1.455 3.018 2.404 0 1.05-.989 1.65-2.261 1.65-1.789 0-3.32-.71-4.706-1.855l-1.636 3.69c1.696 1.347 4.148 1.968 6.505 1.968 4.398 0 7.433-2.316 7.433-5.83 0-3.957-3.92-5.187-7.321-6.48z" />
              </svg>
              Financial Setup (Stripe Connect)
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Connect your bank account to start receiving payments directly from your customers when they book your services online.
            </p>
          </div>
          
          <div className="shrink-0">
            {tenant.stripeOnboardingComplete ? (
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Account Verified & Active</span>
              </div>
            ) : (
              <form action={createStripeConnectAccount}>
                <button 
                  type="submit" 
                  className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  <span>Connect with Stripe</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings Placeholder */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">Upcoming Appointments</h2>
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-950/50">
          <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-medium text-slate-300">No appointments today</h3>
          <p className="text-xs text-slate-500 mt-1">When customers book your services, they will appear here.</p>
        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, trend, trendUp }: { title: string, value: string, trend: string, trendUp?: boolean }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full group-hover:bg-indigo-500/10 transition-colors" />
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-2 mb-1 drop-shadow-sm">{value}</p>
      <p className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-slate-500'}`}>
        {trend}
      </p>
    </div>
  );
}
