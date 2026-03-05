import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function PortalDashboard() {
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

  // If we don't have a user, this page should be protected and redirect to login
  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Please log in to view your bookings</h2>
      </div>
    );
  }

  // Fetch customer details and their bookings
  const { data: customerData } = await supabase
    .from('customers')
    .select(`
      id,
      full_name,
      bookings (
        id,
        start_time,
        end_time,
        status,
        tenants ( name, slug ),
        services ( name_translatable )
      )
    `)
    .eq('auth_id', user.id)
    .single();

  const bookings = customerData?.bookings || [];
  const upcomingBookings = bookings.filter(b => new Date(b.start_time) >= new Date() && b.status !== 'cancelled').sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const pastBookings = bookings.filter(b => new Date(b.start_time) < new Date() || b.status === 'cancelled').sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
         <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
               <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back, {customerData?.full_name || 'Customer'}!</h2>
              <p className="mt-1 text-slate-500">Manage your upcoming appointments across all businesses.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upcoming Appointments
          </h3>
          
          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking: any) => {
                const tenantName = Array.isArray(booking.tenants) ? booking.tenants[0]?.name : booking.tenants?.name;
                const tenantSlug = Array.isArray(booking.tenants) ? booking.tenants[0]?.slug : booking.tenants?.slug;
                const serviceName = Array.isArray(booking.services) ? booking.services[0]?.name_translatable?.['en'] : booking.services?.name_translatable?.['en'];
                
                return (
                  <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-xl"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">{serviceName}</h4>
                        <p className="text-slate-500 text-sm mt-1">at {tenantName}</p>
                        
                        <div className="mt-4 flex items-center space-x-4 text-sm font-medium text-slate-700">
                           <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(booking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                           </div>
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                             {booking.status}
                           </span>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/${tenantSlug}/booking/${booking.id}/manage`}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center">
              <p className="text-slate-500">No upcoming bookings. Time to treat yourself!</p>
              <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-sm font-medium hover:bg-indigo-700 transition-colors">
                Find a Service
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Past Bookings Summary */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Past Appointments
          </h3>
          
          {pastBookings.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <ul className="divide-y divide-slate-100">
                {pastBookings.slice(0, 5).map((booking: any) => {
                  const tenantName = Array.isArray(booking.tenants) ? booking.tenants[0]?.name : booking.tenants?.name;
                  const serviceName = Array.isArray(booking.services) ? booking.services[0]?.name_translatable?.['en'] : booking.services?.name_translatable?.['en'];
                  return (
                    <li key={booking.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{serviceName}</p>
                          <p className="text-xs text-slate-500">{tenantName} • {new Date(booking.start_time).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          {booking.status}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {pastBookings.length > 5 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                  <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">View all past bookings</button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
              <p className="text-sm text-slate-500">Your history will appear here once you've completed appointments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
