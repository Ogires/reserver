'use client';

import { useState } from 'react';
import { deleteService, updateService } from './actions';

interface ServiceListItemProps {
  service: any; // Type from Supabase or Domain entity
  currency: string;
}

export default function ServiceListItem({ service, currency }: ServiceListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Form states
  const [nameEs, setNameEs] = useState(service.name_translatable?.es || '');
  const [nameEn, setNameEn] = useState(service.name_translatable?.en || '');
  const [duration, setDuration] = useState(service.duration_minutes || 30);
  const [price, setPrice] = useState(service.price || 0);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append('name_es', nameEs);
      formData.append('name_en', nameEn);
      formData.append('duration_minutes', duration.toString());
      formData.append('price', price.toString());
      
      await updateService(service.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update service:', error);
      alert('Failed to update service');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    setIsPending(true);
    try {
      await deleteService(service.id);
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Failed to delete service');
      setIsPending(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm border-2 border-indigo-500/50 p-5 rounded-2xl transition-all shadow-lg shadow-indigo-500/10">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name (ES)</label>
              <input
                type="text"
                required
                value={nameEs}
                onChange={(e) => setNameEs(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name (EN)</label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration (min)</label>
              <input
                type="number"
                required
                min="5"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Price ({currency})</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Display Mode
  return (
    <div className="group bg-slate-900/30 hover:bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 hover:border-indigo-500/30 p-5 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 shrink-0 bg-slate-800/80 rounded-xl flex items-center justify-center text-slate-300 border border-slate-700/50 font-medium text-lg shadow-inner group-hover:border-indigo-500/30 group-hover:text-indigo-200 transition-colors">
          {service.duration_minutes}'
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
            {service.name_translatable?.en || 'Unnamed Service'}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            {service.name_translatable?.es || 'Sin nombre'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 shrink-0 sm:ml-auto">
        <div className="text-right">
          <p className="text-lg font-bold text-white">
            {service.price} <span className="text-sm font-medium text-slate-500 uppercase">{currency}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit Button */}
          <button 
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          
          {/* Delete Button */}
          <button 
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <svg className="w-4 h-4 animate-spin text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
