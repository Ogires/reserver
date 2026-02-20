'use client';

import { useState } from 'react';

type Slot = {
  startTime: string;
  endTime: string;
  available: boolean;
};

interface BookingGridProps {
  slots: Slot[];
  onSelectSlot: (startTime: string) => void;
  selectedSlot: string | null;
}

export function BookingGrid({ slots, onSelectSlot, selectedSlot }: BookingGridProps) {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <svg className="w-12 h-12 text-zinc-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No availability</h3>
        <p className="text-zinc-500 mt-2 text-sm max-w-sm">
          There are no available slots for this date. Please select another day.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="booking-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {slots.map((slot) => {
        const date = new Date(slot.startTime);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isSelected = selectedSlot === slot.startTime;

        if (!slot.available) {
          return (
            <div
              key={slot.startTime}
              className="flex items-center justify-center py-4 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 cursor-not-allowed opacity-60 line-through decoration-zinc-300 dark:decoration-zinc-700 transition-all"
            >
              {timeString}
            </div>
          );
        }

        return (
          <button
            key={slot.startTime}
            data-testid="available-slot"
            onClick={() => onSelectSlot(slot.startTime)}
            className={`
              relative flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all duration-300 ease-out font-medium
              ${isSelected 
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-black scale-105' 
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-[1.02]'
              }
            `}
          >
            <span className="text-lg tracking-tight">{timeString}</span>
            {isSelected && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white dark:border-zinc-900"></span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
