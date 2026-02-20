import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';

import { onboardTenant } from '../actions';
import OnboardingForm from './OnboardingForm';

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
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
