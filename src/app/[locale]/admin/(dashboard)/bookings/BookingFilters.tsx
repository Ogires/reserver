'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useTransition } from 'react';

export default function BookingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [dateQuery, setDateQuery] = useState(searchParams.get('date') || 'all');

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const applyFilters = (newQ?: string, newStatus?: string, newDate?: string) => {
    startTransition(() => {
      let qr = query;
      let st = status;
      let dt = dateQuery;
      
      if (newQ !== undefined) qr = newQ;
      if (newStatus !== undefined) st = newStatus;
      if (newDate !== undefined) dt = newDate;

      let qs = createQueryString('q', qr);
      
      const p1 = new URLSearchParams(qs);
      if (st && st !== 'all') p1.set('status', st);
      else p1.delete('status');

      if (dt && dt !== 'all') p1.set('date', dt);
      else p1.delete('date');

      router.push(`?${p1.toString()}`);
    });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      applyFilters(query, undefined, undefined);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4 shadow-lg mb-6 flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className={`w-5 h-5 text-slate-500 ${isPending ? 'animate-pulse text-indigo-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by customer name..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={dateQuery}
          onChange={(e) => {
            setDateQuery(e.target.value);
            applyFilters(undefined, undefined, e.target.value);
          }}
          className="bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
        >
          <option value="all">Any Date</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            applyFilters(undefined, e.target.value, undefined);
          }}
          className="bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );
}
