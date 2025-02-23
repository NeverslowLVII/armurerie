import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { initializeApp } from '@/lib/init'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: 'Armurerie',
  description: 'Gestion d\'armes',
  icons: {
    icon: '/favicon.ico',
  },
}

// Initialiser l'application au démarrage
initializeApp().catch(console.error);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${poppins.className} min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 