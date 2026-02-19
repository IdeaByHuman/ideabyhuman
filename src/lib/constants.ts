export const SITE_NAME = 'ideabyhuman'
export const SITE_DESCRIPTION = 'Where human vision meets AI capability. A curated showcase of projects built by people who had the idea and used AI to bring it to life.'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ideabyhuman.com'

export const PROJECT_STATUSES = ['pending', 'approved', 'rejected', 'archived'] as const
export type ProjectStatus = typeof PROJECT_STATUSES[number]

export const USER_ROLES = ['creator', 'reviewer', 'admin'] as const
export type UserRole = typeof USER_ROLES[number]

export const REVIEW_DECISIONS = ['approve', 'reject', 'request_changes'] as const
export type ReviewDecision = typeof REVIEW_DECISIONS[number]

export const AI_TOOLS = [
  'Claude',
  'ChatGPT',
  'GPT-4',
  'GitHub Copilot',
  'Cursor',
  'Midjourney',
  'DALL-E',
  'v0.dev',
  'Lovable',
  'Windsurf',
  'Other',
] as const

export const BUILD_TIME_OPTIONS = [
  { value: 'under_1_week', label: 'Under 1 week' },
  { value: '1_4_weeks', label: '1-4 weeks' },
  { value: '1_3_months', label: '1-3 months' },
  { value: '3_6_months', label: '3-6 months' },
  { value: 'over_6_months', label: '6+ months' },
] as const

export const CATEGORIES = [
  { name: 'Web Applications', slug: 'web-apps', icon: 'Globe' },
  { name: 'Mobile Apps', slug: 'mobile-apps', icon: 'Smartphone' },
  { name: 'Content Tools', slug: 'content-tools', icon: 'PenTool' },
  { name: 'Automation', slug: 'automation', icon: 'Zap' },
  { name: 'Creative Projects', slug: 'creative', icon: 'Palette' },
  { name: 'Data & Analytics', slug: 'data-analytics', icon: 'BarChart3' },
  { name: 'E-commerce', slug: 'ecommerce', icon: 'ShoppingCart' },
] as const
