import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { checkEnvironment } from '@/lib/config'
import './globals.css'

// Initialize configuration check
checkEnvironment()

export const metadata: Metadata = {
  title: 'ChatGPT Clone',
  description: 'A ChatGPT clone built with Next.js, Supabase, and Claude API',
  keywords: ['chatgpt', 'ai', 'chat', 'claude', 'next.js'],
  authors: [{ name: 'Your Name' }],
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}