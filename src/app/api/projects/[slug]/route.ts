import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/projects/[slug] — Get a single project by slug (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Increment view count (fire and forget)
  supabase
    .from('projects')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)
    .then(() => {})

  return NextResponse.json({ project: data })
}
