'use client';

import { useRef, useEffect, useMemo } from 'react';

interface PremiumDateSelectorProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  maxDaysInFuture?: number;
}

export function PremiumDateSelector({ selectedDate, onSelectDate, maxDaysInFuture = 60 }: PremiumDateSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate an array of dates from today up to maxDaysInFuture
  const dates = useMemo(() => {
    return Array.from({ length: maxDaysInFuture }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [maxDaysInFuture]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Scroll active date into view on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="w-full relative">
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-3 pb-4 pt-2 px-1 snap-x no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isSelected = selectedDate === dateStr;
          
          return (
            <button
              key={dateStr}
              data-active={isSelected}
              onClick={() => onSelectDate(dateStr)}
              className={`
                snap-center shrink-0 flex flex-col items-center justify-center p-3 sm:px-4 rounded-2xl border transition-all duration-300 ease-out min-w-[4.5rem]
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-600 shadow-lg shadow-indigo-600/30 text-white scale-105' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-300 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:scale-105'
                }
              `}
            >
              <span className={`text-xs uppercase font-medium tracking-wider mb-1 ${isSelected ? 'text-indigo-100' : 'text-zinc-500'}`}>
                {days[date.getDay()]}
              </span>
              <span className={`text-2xl font-bold tracking-tighter ${isSelected ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                {date.getDate()}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-widest mt-1 ${isSelected ? 'text-indigo-200' : 'text-zinc-400'}`}>
                {months[date.getMonth()]}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Fade gradients for visual depth */}
      <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent pointer-events-none rounded-l-3xl"></div>
      <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent pointer-events-none rounded-r-3xl"></div>
    </div>
  );
}
