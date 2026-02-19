import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/projects — List approved projects (public)
 * Query params: category, tag, search, page, limit
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const offset = (page - 1) * limit

  let query = supabase
    .from('projects')
    .select('*, categories(name, slug)', { count: 'exact' })
    .eq('status', 'approved')
    .order('submission_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('categories.slug', category)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    projects: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

/**
 * POST /api/projects — Submit a new project (authenticated)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json()

  // Generate slug from title
  const slug = body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...body,
      slug,
      creator_id: user.id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Send submission confirmation email via Resend

  return NextResponse.json({ project: data }, { status: 201 })
}
