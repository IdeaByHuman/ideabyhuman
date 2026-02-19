import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/reviews — List pending submissions (reviewer/admin only)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Check user role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['reviewer', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*, categories(name, slug)')
    .eq('status', 'pending')
    .order('submission_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pending: data })
}

/**
 * POST /api/admin/reviews — Submit a review decision (reviewer/admin only)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['reviewer', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { project_id, decision, feedback, scores } = body

  // Create review record
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert({
      project_id,
      reviewer_id: user.id,
      decision,
      feedback,
      originality_score: scores?.originality,
      execution_score: scores?.execution,
      story_score: scores?.story,
      ai_integration_score: scores?.ai_integration,
    })

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 })
  }

  // Update project status
  const newStatus = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'pending'
  const updateData: Record<string, unknown> = { status: newStatus }
  if (decision === 'approve') {
    updateData.approval_date = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', project_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // TODO: Send approval/rejection email via Resend

  return NextResponse.json({ success: true, decision, project_id })
}
