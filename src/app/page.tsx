import { redirect } from 'next/navigation';

export default function RootPage() {
  // Temporary redirect to a demo tenant "peluqueria-juan" for demonstration purposes.
  // In a real app, this would be a landing page for the SaaS.
  redirect('/peluqueria-juan');
}
