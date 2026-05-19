import { Inter } from 'next/font/google'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export default function SubmitSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen flex flex-col bg-white text-gray-900`}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
