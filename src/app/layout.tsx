import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} min-h-screen flex flex-col bg-white text-gray-900`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
