'use client'

import { ThemeProvider } from 'next-themes'
import { DataProvider } from '../context/DataContext'
import { SessionProvider } from 'next-auth/react'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from '../redux/store'

export function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <DataProvider useOverlay={true}>
            {children}
          </DataProvider>
        </ThemeProvider>
      </ReduxProvider>
    </SessionProvider>
  )
} 