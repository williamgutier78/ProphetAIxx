import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProphetAI | The Oracle of Pumpfun',
  description: 'AI-powered prediction engine monitoring Pumpfun launches in real-time',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="scanlines" />
        {children}
      </body>
    </html>
  )
}
