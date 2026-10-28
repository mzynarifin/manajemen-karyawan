import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { themeScript } from '@/components/ui/theme-toggle'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'HRIS PT Sentra Karya Digital',
    template: '%s · HRIS',
  },
  description: 'Human Resource Information System',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f14' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">{children}</body>
    </html>
  )
}
