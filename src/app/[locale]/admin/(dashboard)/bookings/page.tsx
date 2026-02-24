import { requireTenant } from '../../utils';
import { createClient } from '../../../../../utils/supabase/server';

export default async function BookingsPage() {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  // Fetch upcoming bookings for this tenant (joining services and customers)
  const { data: rawBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      status,
      payment_status,
      services ( name_translatable ),
      customers ( full_name, email, phone )
    `)
    .eq('tenant_id', tenant.id)
    .order('start_time', { ascending: true }); // Ideally we'd filter > now()

  const bookings = rawBookings as any[] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Bookings Overview</h1>
        <p className="text-slate-400 mt-2">View and manage appointments made by your customers.</p>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl">
        {bookings.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="inline-flex w-16 h-16 bg-slate-800/50 rounded-2xl items-center justify-center border border-slate-700/50 text-slate-400 mb-6 shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No bookings found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Your generated booking grid is empty. Share your link to start receiving guests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Service</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {bookings.map((booking) => {
                  const start = new Date(booking.start_time);
                  const dtStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const timeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={booking.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-wide">{dtStr}</div>
                        <div className="text-sm text-slate-500 font-medium">{timeStr}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-slate-200">{booking.customers?.full_name || 'Walk-in'}</div>
                        <div className="text-xs text-slate-500">{booking.customers?.email}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-slate-300">
                          {booking.services?.name_translatable?.en || booking.services?.name_translatable?.es || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                          booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          booking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center text-xs font-bold uppercase tracking-wider ${
                          booking.payment_status === 'paid_online' ? 'text-emerald-400' :
                          booking.payment_status === 'unpaid' ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {booking.payment_status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
}
