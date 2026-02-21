import { Suspense } from 'react';
import BookingInterface from './BookingInterface';

interface TenantPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenantSlug } = await params;

  // In a real app, we would fetch the exact Tenant ID and Services from DB here.
  // For the sake of the TFM demonstration before full DB seeding, we mock the initial data.
  const mockTenantId = 't1'; 
  const mockServices = [
    { 
      id: 's1', 
      name: 'Premium Haircut', 
      description: 'A full service haircut including consultation, wash, premium cut, and styling with our best products.',
      imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=300&fit=crop',
      durationMinutes: 45, 
      price: 25.0, 
      currency: 'EUR' 
    },
    { 
      id: 's2', 
      name: 'Beard Trim', 
      description: 'Quick and precise beard trimming and shaping.',
      durationMinutes: 15, 
      price: 10.0, 
      currency: 'EUR' 
    },
    { 
      id: 's3', 
      name: 'Haircut & Beard', 
      description: 'The complete package for the modern gentleman. Includes hot towel treatement.',
      imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=300&fit=crop',
      durationMinutes: 60, 
      price: 30.0, 
      currency: 'EUR' 
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900">
      
      {/* Header section */}
      <header className="px-6 py-10 md:py-16 max-w-4xl mx-auto flex flex-col items-start border-b border-zinc-200 dark:border-zinc-800">
        <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-lg shadow-indigo-500/20 mb-6 flex items-center justify-center text-white text-2xl font-bold">
          {tenantSlug.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          {tenantSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          Book your appointment online. Select a service and find the perfect time that works for you.
        </p>
      </header>

      {/* Main Booking Interface */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Suspense fallback={<div className="animate-pulse h-96 bg-zinc-200 dark:bg-zinc-800 rounded-3xl"></div>}>
          <BookingInterface 
            tenantId={mockTenantId}
            tenantSlug={tenantSlug}
            services={mockServices}
          />
        </Suspense>
      </main>
      
      {/* Powered by Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8 mt-12 bg-zinc-100 dark:bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-zinc-500 dark:text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} {tenantSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}. All rights reserved.</p>
          <a href="/" className="mt-4 md:mt-0 flex items-center hover:text-indigo-500 transition-colors">
            <span className="bg-gradient-to-br from-indigo-500 to-purple-500 w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white mr-2">R</span>
            Powered by Reserver
          </a>
        </div>
      </footer>

    </div>
  );
}

// Ensure dynamic rendering to fetch fresh slots always
export const dynamic = 'force-dynamic';
