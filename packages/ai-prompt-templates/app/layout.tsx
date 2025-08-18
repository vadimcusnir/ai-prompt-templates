import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Provider as ChakraProvider } from '@/components/ui/provider'
import Navigation from '@/components/Navigation'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Prompt Templates - Cognitive Architecture Platform',
  description: 'Advanced AI prompts for cognitive depth and meaning engineering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChakraProvider>
          <AuthProvider>
            <Navigation />
            {children}
            <CookieConsent />
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  )
}