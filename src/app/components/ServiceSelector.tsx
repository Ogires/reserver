'use client';

import Image from 'next/image';

type Service = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  durationMinutes: number;
  price: number;
  currency: string;
};

interface ServiceSelectorProps {
  services: Service[];
  onSelectService: (serviceId: string) => void;
  selectedServiceId: string | null;
}

export function ServiceSelector({ services, onSelectService, selectedServiceId }: ServiceSelectorProps) {
  if (services.length === 0) {
    return <p className="text-zinc-500 italic">No services available for this tenant.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {services.map(service => {
        const isSelected = selectedServiceId === service.id;
        
        return (
          <button
            key={service.id}
            onClick={() => onSelectService(service.id)}
            className={`
              flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border text-left transition-all duration-300 gap-4
              ${isSelected
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md ring-1 ring-indigo-600'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start gap-4">
              {service.imageUrl && (
                <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <Image 
                    src={service.imageUrl} 
                    alt={service.name} 
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col">
                <span className={`text-base font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {service.name}
                </span>
                {service.description && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {service.description}
                  </span>
                )}
                <span className={`text-xs font-medium uppercase tracking-wider mt-2 ${isSelected ? 'text-indigo-700/80 dark:text-indigo-300' : 'text-zinc-500'}`}>
                  {service.durationMinutes} min
                </span>
              </div>
            </div>
            
            <div className={`mt-2 sm:mt-0 text-lg font-bold shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: service.currency }).format(service.price)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
