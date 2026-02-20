import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Admin/service-role Supabase client — bypasses RLS.
 *
 * Use this ONLY in server-side API routes (never in client components).
 * The service role key has full database access, so this client should
 * only be used for trusted server operations like project submissions
 * where the API route has already verified the user's identity.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
