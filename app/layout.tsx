import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Competitor Review Pipeline',
  description: 'Internal tool for reviewing competitors and generating content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
