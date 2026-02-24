export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-4">
        Booking Confirmed!
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
        Your appointment has been successfully scheduled. We have sent a confirmation email with the details.
      </p>
      
      <a 
        href="/"
        className="mt-10 px-8 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-xl transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
}
