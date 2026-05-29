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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-bg text-t1 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
