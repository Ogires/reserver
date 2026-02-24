'use client';

import { useState, useEffect } from 'react';
import { onboardTenant } from '../actions';

export default function OnboardingForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [host, setHost] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHost(window.location.host + '/');
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Auto-generate slug if user hasn't manually overridden it
    if (!isManualSlug) {
      const generatedSlug = newName
        .toLowerCase()
        .normalize('NFD') // Remove accents
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '') // Remove symbols
        .replace(/\s+/g, '-') // Spaces to hyphens
        .replace(/-+/g, '-') // Remove consecutive hyphens
        .trim();
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsManualSlug(true);
  };

  return (
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
            value={name}
            onChange={handleNameChange}
            className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
            placeholder="e.g. Acme Clinics"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1 block" htmlFor="slug">
            Booking Page URL (Slug)
          </label>
          <div className="flex relative items-stretch">
            <div className="left-0 flex items-center pointer-events-none text-slate-500 bg-slate-950/80 rounded-l-xl border border-slate-800 px-4 whitespace-nowrap">
              {host || 'reserver.app/'}
            </div>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={handleSlugChange}
              className="w-full bg-slate-950/50 border-y border-r border-slate-800 text-white rounded-r-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
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
  );
}
