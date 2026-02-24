import { requireTenant } from '../../utils';
import { createClient } from '../../../../../utils/supabase/server';
import { createSchedule, deleteSchedule, createException, deleteException } from './actions';
import { Schedule } from '../../../../../core/domain/entities/Schedule';
import { ScheduleException } from '../../../../../core/domain/entities/ScheduleException';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function SchedulesPage() {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  // Fetch Schedules
  const { data: rawSchedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('day_of_week', { ascending: true })
    .order('open_time', { ascending: true });

  const schedules = rawSchedules as any[] || [];

  // Fetch Exceptions
  const { data: rawExceptions } = await supabase
    .from('schedule_exceptions')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('exception_date', { ascending: true });

  const exceptions = rawExceptions as any[] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Schedules & Availability</h1>
        <p className="text-slate-400 mt-2">Configure your general business hours and specific date exceptions.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* --- GENERAL SCHEDULES --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-5 h-5 text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Standard Shifts
            </h2>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-slate-300">Add New Shift</h3>
            <form action={createSchedule} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="valid_from">Valid From</label>
                  <input type="date" id="valid_from" name="valid_from" required className="form-input-dark" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="valid_to">Valid To</label>
                  <input type="date" id="valid_to" name="valid_to" required className="form-input-dark" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="day_of_week">Day of Week</label>
                <select id="day_of_week" name="day_of_week" required className="form-input-dark appearance-none">
                  {DAYS.map((day, ix) => (
                    <option key={ix} value={ix}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="open_time">Opens</label>
                  <input type="time" id="open_time" name="open_time" required className="form-input-dark" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="close_time">Closes</label>
                  <input type="time" id="close_time" name="close_time" required className="form-input-dark" />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white font-medium py-2.5 rounded-xl transition-all text-sm mt-2">
                Save Shift
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">{DAYS[s.day_of_week]}</span>
                    <span className="text-xs px-2 py-0.5 rounded flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {s.open_time.slice(0,5)} - {s.close_time.slice(0,5)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Valid: <span className="text-slate-400">{s.valid_from}</span> to <span className="text-slate-400">{s.valid_to}</span>
                  </p>
                </div>
                <form action={async () => { 'use server'; await deleteSchedule(s.id); }}>
                  <button className="text-slate-500 hover:text-rose-400 transition-colors p-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* --- EXCEPTIONS --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-5 h-5 text-amber-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date Exceptions (Holidays)
            </h2>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-slate-300">Add Exception</h3>
            <form action={createException} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="exception_date">Specific Date</label>
                <input type="date" id="exception_date" name="exception_date" required className="form-input-dark" />
              </div>

              <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <input type="checkbox" id="is_closed" name="is_closed" value="true" className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-700 focus:ring-amber-500/50 focus:ring-offset-slate-950" />
                <label className="text-sm font-medium text-slate-300 cursor-pointer" htmlFor="is_closed">Mark whole day as Closed</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="e_open_time">Custom Opens</label>
                  <input type="time" id="e_open_time" name="open_time" className="form-input-dark" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="e_close_time">Custom Closes</label>
                  <input type="time" id="e_close_time" name="close_time" className="form-input-dark" />
                </div>
              </div>

              <p className="text-xs text-slate-500 italic pb-1">Leave custom times blank if marking the entire day as closed.</p>

              <button type="submit" className="w-full bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-300 hover:text-white font-medium py-2.5 rounded-xl transition-all text-sm mt-2">
                Save Exception
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {exceptions.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-white tracking-wider">{e.exception_date}</span>
                    {e.is_closed ? (
                      <span className="text-xs px-2 py-0.5 rounded flex items-center bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold tracking-widest uppercase">
                        Closed
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded flex items-center bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {e.open_time?.slice(0,5)} - {e.close_time?.slice(0,5)}
                      </span>
                    )}
                  </div>
                </div>
                <form action={async () => { 'use server'; await deleteException(e.id); }}>
                  <button className="text-slate-500 hover:text-rose-400 transition-colors p-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </form>
              </div>
            ))}
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .form-input-dark {
          width: 100%;
          background-color: rgba(2, 6, 23, 0.5); /* slate-950 */
          border: 1px solid rgba(30, 41, 59, 1); /* slate-800 */
          color: white;
          border-radius: 0.75rem; /* xl */
          padding: 0.625rem 1rem;
          font-size: 0.875rem; /* sm */
          transition: all 150ms ease;
          color-scheme: dark; /* forces native dark pickers */
        }
        .form-input-dark:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.8); /* indigo-500 */
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .form-input-dark::placeholder {
          color: rgba(71, 85, 105, 1); /* slate-600 */
        }
      `}} />

    </div>
  );
}
