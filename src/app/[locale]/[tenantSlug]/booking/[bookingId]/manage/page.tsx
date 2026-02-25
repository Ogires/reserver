import { getTranslations } from 'next-intl/server';
import { createClient } from '../../../../../../utils/supabase/server';
import { manageCancelBooking } from './actions';
import CancelButton from './CancelButton';

interface ManageBookingPageProps {
  params: Promise<{ locale: string; tenantSlug: string; bookingId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ManageBookingPage({ params, searchParams }: ManageBookingPageProps) {
  const { locale, tenantSlug, bookingId } = await params;
  const tProps = await searchParams;
  const token = typeof tProps.token === 'string' ? tProps.token : undefined;

  const t = await getTranslations('Booking');

  if (!token) {
    return <ErrorState message="Invalid magic link. No token provided." />;
  }

  const supabase = await createClient();

  // Fetch the booking and join service/customer to display details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      status,
      management_token,
      services ( name_translatable ),
      customers ( full_name )
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking || booking.management_token !== token) {
    return <ErrorState message="Invalid or expired magic link. Booking not found." />;
  }

  const start = new Date(booking.start_time);
  const dtStr = start.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const serviceData = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const customerData = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
  
  const serviceName = serviceData?.name_translatable?.[locale] || serviceData?.name_translatable?.['es'] || 'Service';

  // Server action wrapper
  const handleCancel = async () => {
    'use server';
    await manageCancelBooking(bookingId, token, tenantSlug);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        <div className="p-8 text-center border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Manage Appointment</h1>
          <p className="text-zinc-500 text-sm">Review your booking details below.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <span className="text-sm font-medium text-zinc-500">Service</span>
              <span className="font-semibold text-right">{serviceName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <span className="text-sm font-medium text-zinc-500">Date</span>
              <span className="font-semibold text-right">{dtStr}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <span className="text-sm font-medium text-zinc-500">Time</span>
              <span className="font-semibold text-right">{timeStr}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <span className="text-sm font-medium text-zinc-500">Customer</span>
              <span className="font-semibold text-right">{customerData?.full_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4">
              <span className="text-sm font-medium text-zinc-500">Status</span>
              <span className={`text-sm font-bold uppercase tracking-wider ${
                booking.status === 'confirmed' ? 'text-emerald-500' :
                booking.status === 'cancelled' ? 'text-rose-500' :
                'text-amber-500'
              }`}>
                {booking.status}
              </span>
            </div>
          </div>

          <div className="pt-6">
            {booking.status === 'cancelled' ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-center text-sm border border-rose-100 dark:border-rose-900/50">
                This booking has been cancelled and cannot be modified.
              </div>
            ) : (
              <form action={handleCancel}>
                <CancelButton />
              </form>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 text-zinc-900 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center shadow-xl border border-rose-200 dark:border-rose-900/30">
        <div className="w-16 h-16 mx-auto bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Access Denied</h2>
        <p className="text-zinc-500 mb-8">{message}</p>
        <a href="/" className="inline-block bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors">
          Return to Booking
        </a>
      </div>
    </div>
  );
}
