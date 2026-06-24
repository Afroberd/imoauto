'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { VINTI4_ENABLED, buildVinti4Form, type Vinti4FormPayload } from '@/lib/payments/vinti4'

export type Vinti4Result =
  | { ok: true; form: Vinti4FormPayload }
  | { ok: false; error: string }

/**
 * Prepara o formulário Vinti4/SISP para o hóspede pagar a reserva. O cliente
 * faz auto-submit (POST) deste formulário para o gateway da SISP. O resultado
 * volta em /api/webhooks/vinti4, que cria o payment row (o trigger SQL promove
 * a reserva para 'paid').
 */
export async function createVinti4Checkout(bookingId: string): Promise<Vinti4Result> {
  if (!VINTI4_ENABLED) {
    return { ok: false, error: 'O pagamento por Vinti4 ainda não está ativo.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, guest_id, status, total_cve, paid_amount_cve')
    .eq('id', bookingId)
    .maybeSingle()

  if (!booking) return { ok: false, error: 'Reserva não encontrada.' }
  const bk = booking as {
    id: string; guest_id: string; status: string
    total_cve: number; paid_amount_cve: number
  }
  if (bk.guest_id !== user.id) return { ok: false, error: 'Esta reserva não é tua.' }
  if (bk.status !== 'confirmed') return { ok: false, error: 'Esta reserva não está à espera de pagamento.' }

  const remaining = bk.total_cve - bk.paid_amount_cve
  if (remaining <= 0) return { ok: false, error: 'Já está paga.' }

  const h = await headers()
  const protocol = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('host') ?? 'www.imoauto.cv'
  const origin = `${protocol}://${host}`

  const form = buildVinti4Form({
    bookingId: bk.id,
    amountCve: remaining,
    reference: bk.id.slice(0, 8).toUpperCase(),
    returnUrl: `${origin}/api/webhooks/vinti4`,
  })

  if (!form) return { ok: false, error: 'Vinti4 não configurado.' }
  return { ok: true, form }
}
