import { ImageResponse } from 'next/og';

export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 32, height: 32 },
      id: 'favicon-32',
    },
    {
      contentType: 'image/png',
      size: { width: 192, height: 192 },
      id: 'icon-192',
    },
    {
      contentType: 'image/png',
      size: { width: 512, height: 512 },
      id: 'icon-512',
    }
  ];
}

export default function Icon({ id }: { id: string }) {
  const isSmall = id === 'favicon-32';
  
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #020617 0%, #1e293b 100%)',
          borderRadius: isSmall ? '6px' : '20%',
          border: isSmall ? '1px solid rgba(255,255,255,0.1)' : '4px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{
          display: 'flex',
          color: '#38bdf8', /* Sky 400 */
          fontSize: isSmall ? 20 : id === 'icon-192' ? 120 : 320,
          fontFamily: 'sans-serif',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          textShadow: isSmall ? 'none' : '0 8px 16px rgba(0,0,0,0.5)',
        }}>
          BK
        </div>
      </div>
    ),
    {
      width: isSmall ? 32 : id === 'icon-192' ? 192 : 512,
      height: isSmall ? 32 : id === 'icon-192' ? 192 : 512,
    }
  );
}
