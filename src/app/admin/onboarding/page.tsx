import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';

import { onboardTenant } from '../actions';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Check if tenant already exists for this user email
  // Simplified for MVP: We check if there's any tenant matching their auth info
  // Realistically we'd add an owner_id to the tenants table.
  
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30 font-sans">
      
      {/* Decorative background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Let's set up your business
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Tell us about your spaces and how you want your booking page to look.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 p-8 sm:p-10 rounded-3xl shadow-2xl">
          <form action={onboardTenant} className="space-y-8">
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1 block" htmlFor="name">
                  Business Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
                  placeholder="e.g. Acme Clinics"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1 block" htmlFor="slug">
                  Booking Page URL (Slug)
                </label>
                <div className="flex relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 bg-slate-950/80 rounded-l-xl border-y border-l border-slate-800 pr-2">
                    bookable.com/
                  </div>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-r-xl rounded-l-none pl-[120px] px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
                    placeholder="acme-clinics"
                  />
                </div>
                <p className="text-xs text-slate-500 ml-1 mt-1">This is the link you will share with your customers.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1 block" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1 block" htmlFor="slot_interval_minutes">
                    Calendar Granularity
                  </label>
                  <select
                    id="slot_interval_minutes"
                    name="slot_interval_minutes"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="15">Every 15 minutes</option>
                    <option value="30" defaultValue="30">Every 30 minutes</option>
                    <option value="60">Every 60 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60">
              <button
                type="submit"
                className="w-full bg-white text-slate-950 hover:bg-slate-200 font-bold py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98] flex items-center justify-center text-lg"
              >
                Launch my workspace
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
