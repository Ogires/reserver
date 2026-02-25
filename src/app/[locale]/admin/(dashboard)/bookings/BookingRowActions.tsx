'use client';

import { useState, useTransition } from 'react';
import { updateBookingStatus } from './actions';

export default function BookingRowActions({ booking }: { booking: any }) {
  const [isPending, startTransition] = useTransition();
  const [errorLocal, setErrorLocal] = useState('');

  const handleAction = (status: 'confirmed' | 'cancelled') => {
    startTransition(async () => {
      try {
        setErrorLocal('');
        await updateBookingStatus(booking.id, status);
      } catch (err: any) {
        setErrorLocal('Failed to update status');
      }
    });
  };

  if (booking.status !== 'pending') {
    return (
      <div className="flex justify-end gap-2 text-xs">
        {/* If not pending, we could offer cancellation if confirmed, but we keep it simple for now */}
        {booking.status === 'confirmed' && (
          <button
            onClick={() => handleAction('cancelled')}
            disabled={isPending}
            className="text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50"
            title="Cancel this booking"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      {errorLocal && <span className="text-red-400 text-xs self-center">{errorLocal}</span>}
      <button
        onClick={() => handleAction('cancelled')}
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '...' : 'Cancel'}
      </button>
      <button
        onClick={() => handleAction('confirmed')}
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '...' : 'Confirm'}
      </button>
    </div>
  );
}
