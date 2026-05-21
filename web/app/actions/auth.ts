'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error: string } | undefined

function getSiteOrigin(headerHost: string | null) {
  const env = process.env.NEXT_PUBLIC_SITE_URL
  if (env) return env.replace(/\/$/, '')
  return headerHost ? `http://${headerHost}` : 'http://localhost:3000'
}

// Only allow same-site relative paths (no protocol, no host) to avoid open redirect.
function safeNext(raw: unknown): string {
  if (typeof raw !== 'string') return '/profile'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/profile'
  return raw
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('fullName') ?? '').trim()
  const next = safeNext(formData.get('next'))

  if (!email || !password) return { error: 'Email e password obrigatórios.' }
  if (password.length < 8) return { error: 'Password tem de ter pelo menos 8 caracteres.' }

  const supabase = await createClient()
  const h = await headers()
  const origin = getSiteOrigin(h.get('host'))

  const callback = `${origin}/auth/callback?next=${encodeURIComponent(next)}`
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: callback,
    },
  })

  if (error) return { error: error.message }
  redirect(`/login?registered=1&next=${encodeURIComponent(next)}`)
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(formData.get('next'))

  if (!email || !password) return { error: 'Email e password obrigatórios.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }
  redirect(next)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signInWithGoogle(formData?: FormData) {
  const next = safeNext(formData?.get('next'))
  const supabase = await createClient()
  const h = await headers()
  const origin = getSiteOrigin(h.get('host'))

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  })

  if (error) throw new Error(error.message)
  if (data?.url) redirect(data.url)
}
