import type { Metadata } from 'next'
import TrendwatchClient from './trendwatch-client'

export const metadata: Metadata = {
  title: 'Trendwatch - IdeaByHuman',
  description:
    'Internal tool - pull recent items from a configurable list of RSS and Atom feeds into a copyable digest.',
  robots: { index: false, follow: false },
}

export default function TrendwatchPage() {
  return <TrendwatchClient />
}
