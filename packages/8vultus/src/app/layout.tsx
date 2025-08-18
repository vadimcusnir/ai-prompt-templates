import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/shared/styles/brand-themes.css'
import { BrandProvider } from '@/shared/contexts/BrandContext'
import { BRAND_IDS } from '@/shared/types/brand'
import Navigation from '@/components/Navigation'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '8Vultus - Elite Consciousness Mapping & Advanced Cognitive Systems',
  description: 'Elite consciousness mapping and advanced cognitive systems for expert practitioners',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-brand="8vultus">
      <body className={inter.className}>
        <BrandProvider initialBrandId={BRAND_IDS.EIGHT_VULTUS}>
          <Navigation />
          <main className="min-h-screen bg-background text-foreground">
            {children}
          </main>
          <CookieConsent />
        </BrandProvider>
      </body>
    </html>
  )
}
