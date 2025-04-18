import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { initializeApp } from '@/lib/init';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'Armurerie',
  description: "Gestion d'armes",
  icons: {
    icon: '/favicon.ico',
  },
};

// Initialize the app on the server side
try {
  await initializeApp();
} catch (error) {
  console.error('Failed to initialize app:', error);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${poppins.className} min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
