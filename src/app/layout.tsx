import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChatGPT Clone',
  description: 'A ChatGPT clone built with Next.js, Supabase, and Claude API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}