import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Provider } from '@/components/ui/provider'
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Dezactivează service worker-ul care cauzează probleme
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Provider>
          <AuthProvider>
            <Navigation />
            {children}
            <CookieConsent />
          </AuthProvider>
        </Provider>
      </body>
    </html>
  )
}