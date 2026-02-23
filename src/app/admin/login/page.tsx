import { login, signup } from '../actions';
import { SocialLoginButton } from '../../../components/auth/SocialLoginButton';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30 font-sans">
      
      {/* Decorative background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/10 blur-[100px] rounded-full mix-blend-screen -translate-y-1/2 translate-x-1/3" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
            <span className="text-xl font-bold tracking-tight text-white">Bookable</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Welcome back
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Log in to manage your spaces, schedules and reservations.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 backdrop-blur-md">
            <svg className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium text-rose-200">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-3 backdrop-blur-md">
            <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium text-emerald-200">{message}</p>
          </div>
        )}

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 p-8 rounded-2xl shadow-2xl">
          
          {/* Social Login Section */}
          <div className="mb-6">
            <SocialLoginButton provider="google" />
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-500">Or continue with email</span>
              </div>
            </div>
          </div>

          <form className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                formAction={login}
                className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98] flex items-center justify-center"
              >
                Sign In
              </button>
              
              <button
                formAction={signup}
                className="w-full bg-transparent hover:bg-slate-800/50 border border-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center"
              >
                Create new business
              </button>
            </div>
            
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            By signing in, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
