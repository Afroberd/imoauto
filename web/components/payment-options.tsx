'use client'

import { useState, useTransition } from 'react'
import { createStripeCheckout } from '@/app/actions/stripe-checkout'

interface Props {
  bookingId: string
  totalCve: number
  payoutIban: string | null
  payoutHolderName: string | null
  payoutInstructions: string | null
  stripeEnabled: boolean
}

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

export function PaymentOptions({
  bookingId, totalCve, payoutIban, payoutHolderName, payoutInstructions, stripeEnabled,
}: Props) {
  const [selected, setSelected] = useState<'stripe' | 'transfer' | 'vinti4' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function payWithStripe() {
    setError(null)
    startTransition(async () => {
      const r = await createStripeCheckout(bookingId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      window.location.href = r.url
    })
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-warn/40 bg-warn-soft p-3 text-[13px]">
      <p className="font-medium text-warn-strong">
        Pagar {formatCVE(totalCve)}
      </p>
      <p className="mt-1 text-[12px] text-text-2">
        Escolhe a forma de pagamento. Depois de pagares, a tua reserva fica garantida.
      </p>

      <div className="mt-3 space-y-2">
        {/* Stripe — cartão */}
        <MethodCard
          icon="💳"
          title="Cartão (Visa, Mastercard)"
          subtitle={stripeEnabled ? 'Pagamento instantâneo · Stripe' : 'Em breve — aguardando ativação'}
          selected={selected === 'stripe'}
          onClick={() => setSelected('stripe')}
          disabled={!stripeEnabled}
        />

        {/* Manual transfer */}
        <MethodCard
          icon="🏦"
          title="Transferência bancária"
          subtitle={payoutIban ? `IBAN ${payoutIban}` : 'Anfitrião indica os dados por mensagem'}
          selected={selected === 'transfer'}
          onClick={() => setSelected('transfer')}
        />

        {/* Vinti4 */}
        <MethodCard
          icon="💴"
          title="Vinti4"
          subtitle="Em breve — integração com SISP em curso"
          selected={selected === 'vinti4'}
          onClick={() => setSelected('vinti4')}
          disabled
        />
      </div>

      {/* Selected method panel */}
      {selected === 'stripe' && stripeEnabled && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-[12px] text-text-2">
            Vais ser redirecionado para a página segura do Stripe para introduzir os dados do cartão.
            Após o pagamento, a tua reserva fica imediatamente paga e garantida.
          </p>
          <button
            onClick={payWithStripe}
            disabled={isPending}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-deep disabled:opacity-50 sm:w-auto"
          >
            {isPending ? 'A abrir Stripe…' : `Pagar ${formatCVE(totalCve)} agora`}
          </button>
          {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        </div>
      )}

      {selected === 'transfer' && (
        <div className="mt-3 rounded-xl bg-white p-3 text-text-1">
          {payoutIban ? (
            <div className="space-y-1 text-[13px]">
              <p><span className="text-text-3">IBAN:</span> <span className="tnum font-medium">{payoutIban}</span></p>
              {payoutHolderName && <p><span className="text-text-3">Titular:</span> {payoutHolderName}</p>}
              <p><span className="text-text-3">Valor:</span> <span className="tnum font-medium">{formatCVE(totalCve)}</span></p>
              <p><span className="text-text-3">Referência:</span> <span className="tnum">{bookingId.slice(0, 8).toUpperCase()}</span></p>
              {payoutInstructions && (
                <p className="mt-2 italic text-text-2">&ldquo;{payoutInstructions}&rdquo;</p>
              )}
              <p className="mt-2 text-[12px] text-text-3">
                Depois de transferires, envia uma mensagem ao anfitrião com o comprovativo.
                Quando ele confirmar, a tua reserva fica garantida.
              </p>
            </div>
          ) : (
            <div className="text-[13px] text-text-2">
              <p>O anfitrião ainda não publicou IBAN.</p>
              <p className="mt-1">Manda-lhe uma mensagem para combinares como pagar.</p>
            </div>
          )}
        </div>
      )}

      {selected === 'vinti4' && (
        <div className="mt-3 rounded-xl bg-white p-3 text-[13px] text-text-2">
          <p>O pagamento por Vinti4/SISP está em fase de integração.</p>
          <p className="mt-1">Por agora, usa transferência bancária ou cartão.</p>
        </div>
      )}
    </div>
  )
}

function MethodCard({
  icon, title, subtitle, selected, onClick, disabled,
}: {
  icon: string; title: string; subtitle: string
  selected: boolean; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
        disabled
          ? 'border-shell bg-shell-soft text-text-3 cursor-not-allowed opacity-60'
          : selected
          ? 'border-ink bg-white shadow-[var(--shadow-card)]'
          : 'border-shell bg-white hover:border-ink'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink">{title}</span>
        <span className="block text-[12px] text-text-3">{subtitle}</span>
      </span>
      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
        selected ? 'border-ink bg-ink' : 'border-shell'
      }`}>
        {selected && <span className="h-2 w-2 rounded-full bg-paper" />}
      </span>
    </button>
  )
}
