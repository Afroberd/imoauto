'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateListingSettings } from '@/app/actions/listing-settings'

interface Props {
  listingId: string
  initial: {
    instant_booking: boolean
    require_verification: boolean
    payment_window_hours: number
    payout_iban: string | null
    payout_holder_name: string | null
    payout_instructions: string | null
  }
}

export function ListingSettingsForm({ listingId, initial }: Props) {
  const router = useRouter()
  const [instantBooking, setInstantBooking] = useState(initial.instant_booking)
  const [requireVerification, setRequireVerification] = useState(initial.require_verification)
  const [paymentWindow, setPaymentWindow] = useState(String(initial.payment_window_hours))
  const [iban, setIban] = useState(initial.payout_iban ?? '')
  const [holder, setHolder] = useState(initial.payout_holder_name ?? '')
  const [instructions, setInstructions] = useState(initial.payout_instructions ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const r = await updateListingSettings({
        listingId,
        instantBooking,
        requireVerification,
        paymentWindowHours: Number(paymentWindow) || 24,
        payoutIban: iban,
        payoutHolderName: holder,
        payoutInstructions: instructions,
      })
      if (!r.ok) { setError(r.error); return }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Booking flow */}
      <section className="rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">Fluxo de reserva</h2>

        <Toggle
          label="Reserva imediata"
          description="Quando ativo, hóspedes que cumpram os requisitos podem reservar sem precisar da tua aprovação manual. Datas ficam imediatamente reservadas (à espera de pagamento)."
          value={instantBooking}
          onChange={setInstantBooking}
        />

        <Toggle
          label="Exigir identidade verificada"
          description="Bloqueia hóspedes que ainda não fizeram upload de documento de identidade. Recomendado."
          value={requireVerification}
          onChange={setRequireVerification}
        />

        <label className="mt-4 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Janela de pagamento (horas)</span>
          <input
            type="number"
            min={1}
            max={168}
            value={paymentWindow}
            onChange={(e) => setPaymentWindow(e.target.value)}
            className="mt-1 w-32 rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm tnum focus:border-ink focus:outline-none"
          />
          <span className="ml-2 text-[12px] text-text-3">
            Tempo que o hóspede tem para pagar depois da reserva ser confirmada. (24h por defeito)
          </span>
        </label>
      </section>

      {/* Payout */}
      <section className="rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">Receber pagamento</h2>
        <p className="mt-1 text-[12px] text-text-3">
          Estes dados são mostrados ao hóspede depois de aceitares a reserva. Por agora os pagamentos são feitos
          diretamente entre vocês (transferência, Vinti4, dinheiro). Integração com gateway vem numa próxima fase.
        </p>

        <label className="mt-4 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">IBAN / Conta</span>
          <input value={iban} onChange={(e) => setIban(e.target.value)}
            placeholder="CV64 0000 0000 0000 0000 0000 0"
            className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm tnum focus:border-ink focus:outline-none" />
        </label>

        <label className="mt-3 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Titular da conta</span>
          <input value={holder} onChange={(e) => setHolder(e.target.value)}
            placeholder="Nome completo no banco"
            className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm focus:border-ink focus:outline-none" />
        </label>

        <label className="mt-3 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Instruções adicionais</span>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
            placeholder="Ex: Envia comprovativo via mensagem depois de transferires. Aceito Vinti4 no momento."
            className="mt-1 w-full resize-none rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm focus:border-ink focus:outline-none" />
        </label>
      </section>

      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {success && <p className="text-[13px] text-green-700">Definições guardadas.</p>}

      <button onClick={submit} disabled={isPending}
        className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50">
        {isPending ? 'A guardar…' : 'Guardar definições'}
      </button>
    </div>
  )
}

function Toggle({
  label, description, value, onChange,
}: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-4 flex items-start gap-4">
      <button
        type="button"
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className={`mt-1 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          value ? 'bg-ink' : 'bg-shell'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-[12px] text-text-3">{description}</p>
      </div>
    </div>
  )
}
