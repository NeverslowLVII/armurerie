import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DataProvider } from '../context/DataContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Armurerie',
  description: 'Gestion d\'armes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  )
} 