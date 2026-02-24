import { createClient } from '../../../../utils/supabase/server';
import { redirect } from 'next/navigation';

import { onboardTenant } from '../actions';
import OnboardingForm from './OnboardingForm';

interface OnboardingPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Check if tenant already exists for this user email
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (tenant) {
    redirect('/admin/dashboard');
  }
  
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

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-red-200 text-sm">{error}</div>
          </div>
        )}

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 p-8 sm:p-10 rounded-3xl shadow-2xl">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
