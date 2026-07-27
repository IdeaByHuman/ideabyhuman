import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mike Berry / IdeaByHuman',
  description:
    'Marketing technology and AI adoption for enterprise commercial organizations. Twenty years at Adobe, Condé Nast, Stitch Fix, eBay, and Apple.',
  openGraph: {
    title: 'Mike Berry / IdeaByHuman',
    description:
      'Marketing technology and AI adoption for enterprise commercial organizations. Twenty years at Adobe, Condé Nast, Stitch Fix, eBay, and Apple.',
    url: 'https://ideabyhuman.com',
    siteName: 'IdeaByHuman',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon-light.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
