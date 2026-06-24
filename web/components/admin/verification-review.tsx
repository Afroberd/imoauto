'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveVerification, rejectVerification, type AdminVerification } from '@/app/actions/admin'

const STATUS_BADGE: Record<AdminVerification['status'], { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  approved: { label: 'Aprovada', className: 'border-green-200 bg-green-50 text-green-800' },
  rejected: { label: 'Rejeitada', className: 'border-red-200 bg-red-50 text-red-700' },
}

const ID_TYPE_LABEL: Record<string, string> = {
  bi: 'Bilhete de Identidade',
  passport: 'Passaporte',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })
}

export function VerificationReview({ v }: { v: AdminVerification }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const badge = STATUS_BADGE[v.status]
  const name = v.display_name || v.email || v.user_id.slice(0, 8)

  function approve() {
    setError(null)
    startTransition(async () => {
      const r = await approveVerification(v.user_id)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  function reject() {
    setError(null)
    startTransition(async () => {
      const r = await rejectVerification(v.user_id, reason)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setRejecting(false)
      setReason('')
      router.refresh()
    })
  }

  return (
    <article className="rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-medium text-ink">{name}</h3>
          {v.email && <p className="truncate text-sm text-text-2">{v.email}</p>}
          <p className="mt-1 text-[12px] text-text-3">Submetido {fmtDate(v.updated_at)}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Details */}
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[12px] uppercase tracking-[0.12em] text-text-3">Documento</dt>
          <dd className="text-ink">
            {v.id_type ? ID_TYPE_LABEL[v.id_type] : '—'} · {v.id_number || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] uppercase tracking-[0.12em] text-text-3">Telefone</dt>
          <dd className="text-ink">{v.phone || '—'}</dd>
        </div>
        {(v.driver_license_number || v.license_photo_signed) && (
          <div className="sm:col-span-2">
            <dt className="text-[12px] uppercase tracking-[0.12em] text-text-3">Carta de condução</dt>
            <dd className="text-ink">{v.driver_license_number || '—'}</dd>
          </div>
        )}
      </dl>

      {/* Document photos */}
      <div className="mt-4 flex flex-wrap gap-3">
        {v.id_photo_signed && (
          <a
            href={v.id_photo_signed}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-40 overflow-hidden rounded-xl border border-shell"
          >
            <DocPreview src={v.id_photo_signed} caption="Documento" />
          </a>
        )}
        {v.license_photo_signed && (
          <a
            href={v.license_photo_signed}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-40 overflow-hidden rounded-xl border border-shell"
          >
            <DocPreview src={v.license_photo_signed} caption="Carta de condução" />
          </a>
        )}
        {!v.id_photo_signed && !v.license_photo_signed && (
          <p className="text-[13px] text-text-3">Sem ficheiros anexados.</p>
        )}
      </div>

      {v.status === 'rejected' && v.rejection_reason && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          Motivo da rejeição: {v.rejection_reason}
        </p>
      )}

      {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

      {/* Actions */}
      <div className="mt-5 border-t border-shell pt-4">
        {rejecting ? (
          <div className="space-y-3">
            <label className="block">
              <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">
                Motivo da rejeição (o utilizador vê isto)
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Ex: foto desfocada, número não corresponde, documento expirado…"
                className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={reject}
                disabled={isPending}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'A rejeitar…' : 'Confirmar rejeição'}
              </button>
              <button
                onClick={() => {
                  setRejecting(false)
                  setReason('')
                }}
                disabled={isPending}
                className="rounded-full border border-shell px-5 py-2 text-sm text-text-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={approve}
              disabled={isPending || v.status === 'approved'}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50"
            >
              {v.status === 'approved' ? '✓ Aprovada' : isPending ? 'A aprovar…' : 'Aprovar'}
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={isPending}
              className="rounded-full border border-shell px-5 py-2 text-sm text-text-2 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-50"
            >
              Rejeitar
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function DocPreview({ src, caption }: { src: string; caption: string }) {
  const isPdf = src.toLowerCase().includes('.pdf')
  return (
    <>
      <div className="flex h-28 items-center justify-center bg-paper-soft">
        {isPdf ? (
          <span className="text-[13px] text-text-2">📄 PDF</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption} className="h-28 w-full object-cover" />
        )}
      </div>
      <span className="block bg-white px-2 py-1.5 text-center text-[12px] text-text-2 group-hover:text-ink">
        {caption} ↗
      </span>
    </>
  )
}
