import { requireTenant } from '../../utils';
import { createClient } from '../../../../utils/supabase/server';

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
