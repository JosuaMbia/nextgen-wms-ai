import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'NextGen WMS AI',
  description: 'Revolutionary AI-powered Warehouse Management System',
  openGraph: {
    title: 'NextGen WMS AI',
    description: 'AI-driven warehouse optimization and predictive analytics',
    url: 'https://nextgen-wms-ai.vercel.app',
    siteName: 'NextGen WMS AI',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-slate-950 text-slate-50 antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
