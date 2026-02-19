import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/upload — Generate a presigned URL for R2 upload (authenticated)
 *
 * Body: { filename: string, contentType: string }
 * Returns: { uploadUrl: string, publicUrl: string }
 *
 * TODO: Implement R2 presigned URL generation using @aws-sdk/s3-request-presigner
 * For now returns a placeholder response.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { filename, contentType } = await request.json()

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  // TODO: Generate presigned URL for Cloudflare R2
  // const key = `projects/${user.id}/${Date.now()}-${filename}`
  // const uploadUrl = await generatePresignedUrl(key, contentType)
  // const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({
    error: 'R2 upload not yet configured — see .env.local.example for required keys',
  }, { status: 501 })
}
