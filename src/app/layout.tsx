/**
 * app/layout.tsx
 * Layout radice dell'applicazione.
 * Contiene: Provider sessione NextAuth, Toaster notifiche, font.
 */
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import SessionProvider from '@/components/providers/SessionProvider'
import { CartProvider } from '@/components/providers/CartProvider'

export const metadata: Metadata = {
  title: 'Braceria Sannicandro',
  description: 'Braceria artigianale a Sannicandro di Bari. Prenota il tuo tavolo o ordina online.',
  keywords: 'braceria, sannicandro di bari, bombette pugliesi, grigliata, delivery',
  openGraph: {
    title: 'Braceria Sannicandro',
    description: 'Carne alla brace, bombette pugliesi e grigliata mista. Sannicandro di Bari.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A1410',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="bg-brace-nero text-brace-testo antialiased">
        <SessionProvider>
          <CartProvider>
          {children}
          <Toaster
            position="top-center"
            gutter={8}
            containerStyle={{ top: 20 }}
            toastOptions={{
              duration: 3500,
              style: {
                background: '#2A2018',
                color: '#EDE0D0',
                border: '1px solid #3D3028',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'var(--font-body)',
                maxWidth: '380px',
              },
              success: {
                iconTheme: { primary: '#E67E22', secondary: '#0A0A0A' },
              },
              error: {
                iconTheme: { primary: '#E74C3C', secondary: '#0A0A0A' },
              },
            }}
          />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
