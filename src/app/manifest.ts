import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexturno',
    short_name: 'Nexturno',
    description: 'El Rey de las Reservas - Plataforma integral para tu negocio',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617', // slate-950
    theme_color: '#38bdf8', // sky-400
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
