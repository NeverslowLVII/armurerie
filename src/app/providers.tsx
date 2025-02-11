'use client'

import { ThemeProvider } from 'next-themes'
import { DataProvider } from '../context/DataContext'

export function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <DataProvider>
        {children}
      </DataProvider>
    </ThemeProvider>
  )
} 