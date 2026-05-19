import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ideabyhuman — Where human vision meets AI capability',
  description:
    'A curated showcase of projects built by people who had the idea and used AI to bring it to life.',
  openGraph: {
    title: 'ideabyhuman',
    description: 'Where human vision meets AI capability',
    url: 'https://ideabyhuman.com',
    siteName: 'ideabyhuman',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
