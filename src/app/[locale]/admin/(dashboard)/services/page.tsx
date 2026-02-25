import { requireTenant } from '../../utils';
import { createClient } from '../../../../../utils/supabase/server';
import ServiceListItem from './ServiceListItem';
import ServiceCreationForm from './ServiceCreationForm';

export default async function ServicesPage() {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  // Fetch existing services
  const { data: rawServices } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  const services = rawServices as any[] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Services</h1>
          <p className="text-slate-400 mt-2">Manage the offerings patients or clients can book with you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <ServiceCreationForm currency={tenant.preferred_currency} />
        </div>

        {/* List of Services */}
        <div className="lg:col-span-2 space-y-4">
          {services.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50 text-slate-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">No services yet</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2">Create your first service using the form on the left. Once created, it will be instantly bookable.</p>
            </div>
          ) : (
            services.map((service) => (
              <ServiceListItem 
                key={service.id} 
                service={service} 
                currency={tenant.preferred_currency} 
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
