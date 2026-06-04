import './globals.css';
import { Providers } from '../components/ui/Providers';
import SplashScreen from '../components/ui/SplashScreen';

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
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="preload" href="/neonize-2.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/logo.svg" as="image" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-bg text-t1 antialiased">
        <Providers>
          <SplashScreen />
          {children}
        </Providers>
      </body>
    </html>
  );
}
