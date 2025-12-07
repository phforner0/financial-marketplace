// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import SessionProvider from '@/components/providers/SessionProvider'; // Importe o componente criado
import '../globals.css';

export const metadata: Metadata = {
  title: 'Financial Marketplace',
  description: 'Modern platform for stock trading and market analysis',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Envolva o children com o SessionProvider */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}