'use client';

import { useFormStatus } from 'react-dom';

export default function CancelButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all
        ${pending 
          ? 'bg-rose-400 dark:bg-rose-900/50 text-white cursor-wait opacity-80' 
          : 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98]'
        }
      `}
    >
      {pending ? 'Cancelling...' : 'Cancel Appointment'}
    </button>
  );
}
