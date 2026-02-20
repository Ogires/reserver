import { requireTenant } from '../../utils';
import { createClient } from '../../../../utils/supabase/server';
import { createService, deleteService } from './actions';
import { Service } from '../../../../core/domain/entities/Service';

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
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 p-6 rounded-2xl shadow-xl sticky top-8">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mr-3 border border-indigo-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              New Service
            </h2>
            
            <form action={createService} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="name_es">
                  Name (Spanish)
                </label>
                <input
                  type="text"
                  id="name_es"
                  name="name_es"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="Ej. Consulta General"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="name_en">
                  Name (English)
                </label>
                <input
                  type="text"
                  id="name_en"
                  name="name_en"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="e.g. General Consultation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="duration_minutes">
                    Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="duration_minutes"
                      name="duration_minutes"
                      min="5"
                      step="5"
                      required
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 pr-12 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                      placeholder="30"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-slate-500 font-medium">
                      min
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="price">
                    Price ({tenant.preferred_currency})
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center text-sm group"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
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
              <div key={service.id} className="group bg-slate-900/30 hover:bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 hover:border-slate-700/60 p-5 rounded-2xl transition-all flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-800/80 rounded-xl flex items-center justify-center text-slate-300 border border-slate-700/50 font-medium text-lg shadow-inner">
                    {service.duration_minutes}'
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {service.name_translatable?.en || 'Unnamed Service'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {service.name_translatable?.es || 'Sin nombre'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {service.price} <span className="text-sm font-medium text-slate-500 uppercase">{service.currency}</span>
                    </p>
                  </div>
                  
                  {/* Delete Button calling Server Action via form */}
                  <form action={async () => {
                    'use server';
                    await deleteService(service.id);
                  }}>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
