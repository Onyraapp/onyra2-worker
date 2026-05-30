import './globals.css';
import { Providers } from '../components/ui/Providers';

export const metadata = {
  title: 'Troco',
  description: 'Control de caja inteligente',
  manifest: '/manifest.json',
  themeColor: '#F5F5F7',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Troco' },
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
       <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
        </Providers>
      </body>
    </html>
  );
}
