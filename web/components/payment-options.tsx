'use client'

import { useState, useTransition } from 'react'
import { createStripeCheckout } from '@/app/actions/stripe-checkout'
import { createVinti4Checkout } from '@/app/actions/vinti4-checkout'

interface Props {
  bookingId: string
  totalCve: number
  stripeEnabled: boolean
  vinti4Enabled: boolean
  simulationEnabled?: boolean
}

type Method = 'card' | 'vinti4'

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

export function PaymentOptions({
  bookingId, totalCve, stripeEnabled, vinti4Enabled, simulationEnabled = false,
}: Props) {
  const vinti4Available = vinti4Enabled || simulationEnabled
  const [selected, setSelected] = useState<Method | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function payWithStripe() {
    setError(null)
    startTransition(async () => {
      const r = await createStripeCheckout(bookingId)
      if (!r.ok) { setError(r.error); return }
      window.location.href = r.url
    })
  }

  function payWithVinti4() {
    setError(null)
    startTransition(async () => {
      const r = await createVinti4Checkout(bookingId)
      if (!r.ok) { setError(r.error); return }
      // Auto-submit de um formulário POST para o gateway da SISP.
      const f = document.createElement('form')
      f.method = 'POST'
      f.action = r.form.action
      for (const [k, v] of Object.entries(r.form.fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = k
        input.value = v
        f.appendChild(input)
      }
      document.body.appendChild(f)
      f.submit()
    })
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-warn/40 bg-warn-soft p-3 text-[13px]">
      <p className="font-medium text-warn-strong">Pagar {formatCVE(totalCve)}</p>
      <p className="mt-1 text-[12px] text-text-2">
        Escolhe a forma de pagamento.
      </p>

      {!stripeEnabled && !vinti4Available ? (
        <div className="mt-3 rounded-xl border border-shell bg-white p-3 text-[13px] text-text-1">
          💳 Pagamento online (Vinti4, Visa e Mastercard) <strong>em breve</strong>. A tua
          reserva fica registada; combina os detalhes com o anfitrião pela área de mensagens.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {/* Cartão (Stripe) */}
          <MethodCard
            icon="💳"
            title="Cartão (Visa, Mastercard)"
            subtitle={stripeEnabled ? 'Pagamento online seguro' : 'Em breve'}
            selected={selected === 'card'}
            onClick={() => setSelected('card')}
            disabled={!stripeEnabled}
          />

          {/* Vinti4 — cobre Vinti4 + Visa + Mastercard */}
          <MethodCard
            icon="💴"
            title="Vinti4"
            subtitle={vinti4Enabled ? 'Vinti4, Visa e Mastercard' : simulationEnabled ? 'Vinti4, Visa e Mastercard · modo teste' : 'Em breve'}
            selected={selected === 'vinti4'}
            onClick={() => setSelected('vinti4')}
            disabled={!vinti4Available}
          />
        </div>
      )}

      {/* Painel do método escolhido */}
      {selected === 'card' && stripeEnabled && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-[12px] text-text-2">
            Serás reencaminhado para a página segura de pagamento. Após pagares, a
            reserva fica imediatamente garantida.
          </p>
          <button
            onClick={payWithStripe}
            disabled={isPending}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-deep disabled:opacity-50 sm:w-auto"
          >
            {isPending ? 'A abrir pagamento…' : `Pagar ${formatCVE(totalCve)} agora`}
          </button>
          {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        </div>
      )}

      {selected === 'vinti4' && !vinti4Enabled && simulationEnabled && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-[12px] text-text-2">
            Serás reencaminhado para a página de pagamento. Após pagares, a
            reserva fica imediatamente garantida.
          </p>
          <a
            href={`/pay/simulate?booking=${bookingId}`}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-deep sm:w-auto"
          >
            Pagar {formatCVE(totalCve)} agora
          </a>
        </div>
      )}

      {selected === 'vinti4' && vinti4Enabled && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-[12px] text-text-2">
            Serás reencaminhado para a página segura da Vinti4/SISP. Após pagares,
            a reserva fica imediatamente garantida.
          </p>
          <button
            onClick={payWithVinti4}
            disabled={isPending}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-deep disabled:opacity-50 sm:w-auto"
          >
            {isPending ? 'A abrir Vinti4…' : `Pagar ${formatCVE(totalCve)} com Vinti4`}
          </button>
          {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        </div>
      )}

      {/* Aviso de segurança — suave, não bloqueante */}
      <p className="mt-3 text-[11px] leading-relaxed text-text-3">
        Dica de segurança: paga sempre através do IMOAUTO. Evita transferências
        adiantadas para contactos que não conheces.
      </p>
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
          ? 'cursor-not-allowed border-shell bg-shell-soft text-text-3 opacity-60'
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
