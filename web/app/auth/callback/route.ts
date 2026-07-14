import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Supabase email OTP types we accept on confirmation links.
const OTP_TYPES: EmailOtpType[] = ['signup', 'recovery', 'email_change', 'invite', 'magiclink']

// Same-site relative path only — blocks open redirects (no protocol, no //).
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/profile'
  return raw
}

// Canonical production origin. NEXT_PUBLIC_SITE_URL wins (=https://www.imoauto.cv);
// otherwise derive from the request so localhost/dev keeps working.
function siteOrigin(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL
  if (env) return env.replace(/\/$/, '')
  const host = req.headers.get('host')
  if (!host) return req.nextUrl.origin
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  const proto = req.headers.get('x-forwarded-proto') ?? (isLocal ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = siteOrigin(request)
  const next = safeNext(searchParams.get('next'))
  const host = request.headers.get('host') ?? 'unknown'

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const typeParam = searchParams.get('type')
  const providerError = searchParams.get('error') ?? searchParams.get('error_code')

  // Never log code/token_hash/tokens/email — only sanitized diagnostics.
  const log = (mode: string, detail: Record<string, unknown>) =>
    console.log('[auth-callback]', JSON.stringify({ mode, host, next, ...detail }))

  // 1) Provider already returned an error (e.g. expired/used link).
  if (providerError) {
    const code = /expired/i.test(providerError) ? 'confirmation_expired'
      : providerError === 'access_denied' ? 'access_denied'
      : 'confirmation_invalid'
    log('provider_error', { supabaseError: providerError, mapped: code })
    return NextResponse.redirect(`${origin}/login?error=${code}`)
  }

  const supabase = await createClient()

  // 2) token_hash flow — works cross-device (no PKCE cookie needed). This is
  //    what email confirmation links use when the template sends TokenHash.
  if (tokenHash && typeParam && (OTP_TYPES as string[]).includes(typeParam)) {
    const type = typeParam as EmailOtpType
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      const mapped = /expired/i.test(error.message) ? 'confirmation_expired' : 'confirmation_invalid'
      log('token_hash', { type, supabaseError: error.message, mapped })
      return NextResponse.redirect(`${origin}/login?error=${mapped}`)
    }
    log('token_hash', { type, ok: true })
    if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/reset-password`)
    if (type === 'signup') return NextResponse.redirect(`${origin}/login?confirmed=1`)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // 3) PKCE code flow — Google OAuth and same-device links (unchanged behaviour).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      log('code', { supabaseError: error.message, mapped: 'callback_exchange_failed' })
      return NextResponse.redirect(`${origin}/login?error=callback_exchange_failed`)
    }
    log('code', { ok: true })
    // Recovery reaches here via next=/auth/reset-password; everything else → next.
    return NextResponse.redirect(`${origin}${next}`)
  }

  // 4) Nothing usable in the URL.
  log('missing_params', {})
  return NextResponse.redirect(`${origin}/login?error=confirmation_invalid`)
}
