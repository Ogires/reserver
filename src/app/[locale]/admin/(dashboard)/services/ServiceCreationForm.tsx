'use client';

import { useState } from 'react';
import { createService } from './actions';
import { useFormStatus } from 'react-dom';

function SubmitButton({ currency }: { currency: string }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating...' : 'Create Service'}
    </button>
  );
}

export default function ServiceCreationForm({ currency }: { currency: string }) {
  const [activeTab, setActiveTab] = useState<'es' | 'en'>('es');

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 p-6 rounded-2xl shadow-xl sticky top-8">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mr-3 border border-indigo-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        New Service
      </h2>
      
      <form action={createService} className="space-y-6">
        
        <div className="space-y-4">
          {/* Language Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 mb-4 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('es')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                activeTab === 'es' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Español
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                activeTab === 'en' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              English
            </button>
          </div>

          {/* Tab Content: ES */}
          <div className={`space-y-4 ${activeTab === 'es' ? 'block' : 'hidden'}`}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="name_es">
                Nombre del Servicio *
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="description_es">
                Descripción (ES)
              </label>
              <textarea
                id="description_es"
                name="description_es"
                rows={3}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
                placeholder="Opcional: Detalles del servicio..."
              />
            </div>
          </div>

          {/* Tab Content: EN */}
          <div className={`space-y-4 ${activeTab === 'en' ? 'block' : 'hidden'}`}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="name_en">
                Service Name *
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
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="description_en">
                Description (EN)
              </label>
              <textarea
                id="description_en"
                name="description_en"
                rows={3}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
                placeholder="Optional: Service details..."
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1" htmlFor="image_url">
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                placeholder="https://example.com/image.jpg"
              />
          </div>
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
              Price ({currency})
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
          <SubmitButton currency={currency} />
        </div>
      </form>
    </div>
  );
}
