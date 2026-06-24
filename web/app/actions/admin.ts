'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Is the current user an admin? Cheap check used by guards and the header. */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return !!data
}

export type AdminVerification = {
  user_id: string
  id_type: 'bi' | 'passport' | null
  id_number: string | null
  id_photo_url: string | null
  driver_license_number: string | null
  driver_license_photo_url: string | null
  phone: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  verified_at: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  email: string | null
  display_name: string | null
  id_photo_signed: string | null
  license_photo_signed: string | null
}

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * List verifications for the admin panel, with signed URLs for the private
 * document photos and the submitter's email/name from `profiles`.
 * Returns [] for non-admins (RLS also blocks the rows defensively).
 */
export async function listVerifications(
  filter: 'pending' | 'all' = 'pending',
): Promise<AdminVerification[]> {
  const supabase = await createClient()
  if (!(await isAdmin())) return []

  let query = supabase
    .from('guest_verifications')
    .select('*')
    .order('updated_at', { ascending: false })
  if (filter === 'pending') query = query.eq('status', 'pending')

  const { data: rows } = await query
  const list = (rows ?? []) as Array<Record<string, unknown>>
  if (list.length === 0) return []

  // Submitter identity (profiles is a public shadow of auth.users).
  const ids = list.map((r) => r.user_id as string)
  const profMap = new Map<string, { email: string; display_name: string | null }>()
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', ids)
  for (const p of (profs ?? []) as Array<{ id: string; email: string; display_name: string | null }>) {
    profMap.set(p.id, { email: p.email, display_name: p.display_name })
  }

  async function sign(path: string | null | undefined): Promise<string | null> {
    if (!path) return null
    const { data } = await supabase.storage.from('verifications').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }

  const out: AdminVerification[] = []
  for (const r of list) {
    const prof = profMap.get(r.user_id as string)
    out.push({
      ...(r as object),
      email: prof?.email ?? null,
      display_name: prof?.display_name ?? null,
      id_photo_signed: await sign(r.id_photo_url as string | null),
      license_photo_signed: await sign(r.driver_license_photo_url as string | null),
    } as AdminVerification)
  }
  return out
}

/** Approve a verification: marks it verified so the user can book. */
export async function approveVerification(userId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!(await isAdmin())) return { ok: false, error: 'forbidden' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('guest_verifications')
    .update({
      status: 'approved',
      verified_at: now,
      rejection_reason: null,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/verificacoes')
  return { ok: true }
}

/** Reject a verification with a reason the user will see and can act on. */
export async function rejectVerification(
  userId: string,
  reason: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!(await isAdmin())) return { ok: false, error: 'forbidden' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('guest_verifications')
    .update({
      status: 'rejected',
      verified_at: null,
      rejection_reason: reason.trim() || 'Documento ilegível ou inválido. Reenvia uma foto nítida.',
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/verificacoes')
  return { ok: true }
}
