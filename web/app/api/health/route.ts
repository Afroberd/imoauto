import { NextResponse } from 'next/server'

// Lightweight public health check for uptime monitoring. No secrets, no
// infrastructure details — just proof the app is serving requests.
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'imoauto-web' })
}
