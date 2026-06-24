/**
 * Resend email sender. Activates only when RESEND_API_KEY is set (like the
 * Stripe gateway): no key → emails are silently skipped, nothing breaks.
 *
 * Uses Resend's REST API via fetch so we don't add an npm dependency.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
// e.g. "IMOAUTO <noreply@imoauto.cv>". Falls back to Resend's shared sandbox
// sender so testing works before the domain is verified.
const EMAIL_FROM = process.env.EMAIL_FROM || 'IMOAUTO <onboarding@resend.dev>'

export const EMAIL_ENABLED = !!RESEND_API_KEY

export type SendEmailResult = { ok: true } | { ok: false; error: string }

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) return { ok: false, error: 'email_disabled' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `resend_${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'fetch_failed' }
  }
}
