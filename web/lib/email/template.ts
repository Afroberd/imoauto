/**
 * Branded HTML wrapper for transactional emails. Inline styles only — email
 * clients strip <style> blocks and external CSS. Maps a notification
 * (title/body/link) into a clean IMOAUTO-styled message.
 */

// Domínio público do site (configurável por env var, com fallback ao .cv).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imoauto.cv'
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')

function absoluteUrl(link: string | null | undefined): string | null {
  if (!link) return null
  if (link.startsWith('http')) return link
  return SITE_URL + (link.startsWith('/') ? link : `/${link}`)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderEmail(opts: {
  title: string
  body?: string | null
  link?: string | null
  cta?: string
}): string {
  const url = absoluteUrl(opts.link)
  const title = escapeHtml(opts.title)
  const body = opts.body ? escapeHtml(opts.body) : ''
  const cta = opts.cta ?? 'Abrir no IMOAUTO'

  const button = url
    ? `<a href="${url}" style="display:inline-block;background:#232220;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:9999px;">${escapeHtml(cta)}</a>`
    : ''

  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:0;background:#f4f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#232220;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e4dd;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0;">
                <p style="margin:0;font-size:18px;letter-spacing:-0.01em;">
                  <span style="font-weight:500;">Imo</span><span style="font-weight:600;font-style:italic;">Auto</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 8px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:600;letter-spacing:-0.02em;">${title}</h1>
              </td>
            </tr>
            ${body ? `<tr><td style="padding:0 32px 8px;"><p style="margin:0;font-size:15px;line-height:1.55;color:#56534c;">${body}</p></td></tr>` : ''}
            ${button ? `<tr><td style="padding:20px 32px 4px;">${button}</td></tr>` : ''}
            <tr>
              <td style="padding:28px 32px 32px;">
                <hr style="border:none;border-top:1px solid #eceae4;margin:0 0 16px;" />
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9a968d;">
                  Recebeste este email porque tens conta no IMOAUTO — o marketplace de
                  imóveis e automóveis de Cabo Verde.
                  <br />
                  <a href="${SITE_URL}" style="color:#9a968d;">${SITE_HOST}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
