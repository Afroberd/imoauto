'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { submitVerification } from '@/app/actions/verification'

interface Props {
  userId: string
  existing?: {
    id_type: 'bi' | 'passport' | null
    id_number: string | null
    id_photo_url: string | null
    driver_license_number: string | null
    driver_license_photo_url: string | null
    phone: string | null
    verified_at: string | null
  } | null
}

type UploadKey = 'id_photo' | 'license_photo'

export function VerificationForm({ userId, existing }: Props) {
  const router = useRouter()
  const [idType, setIdType] = useState<'bi' | 'passport'>((existing?.id_type as 'bi' | 'passport') ?? 'bi')
  const [idNumber, setIdNumber] = useState(existing?.id_number ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(existing?.id_photo_url ?? null)
  const [licenseNumber, setLicenseNumber] = useState(existing?.driver_license_number ?? '')
  const [licensePhotoUrl, setLicensePhotoUrl] = useState<string | null>(existing?.driver_license_photo_url ?? null)
  const [uploading, setUploading] = useState<UploadKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, key: UploadKey) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Ficheiro máximo 5MB.')
      return
    }
    setError(null)
    setUploading(key)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${key}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('verifications').upload(path, file, {
        upsert: true,
        contentType: file.type,
      })
      if (upErr) {
        setError(upErr.message)
        return
      }
      // Signed URL valid for 1 hour for preview; the path is what we store
      const { data: signed } = await supabase.storage.from('verifications').createSignedUrl(path, 3600)
      if (key === 'id_photo') setIdPhotoUrl(path)
      else setLicensePhotoUrl(path)
    } finally {
      setUploading(null)
    }
  }

  function handleSubmit() {
    setError(null)
    setSuccess(false)
    if (!idNumber.trim()) {
      setError('Número do documento é obrigatório.')
      return
    }
    startTransition(async () => {
      const r = await submitVerification({
        idType,
        idNumber,
        idPhotoUrl,
        driverLicenseNumber: licenseNumber,
        driverLicensePhotoUrl: licensePhotoUrl,
        phone,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  const verified = !!existing?.verified_at

  return (
    <div className="space-y-6">
      {verified && (
        <div className="rounded-[var(--radius-card)] border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✓ A tua identidade está verificada. Podes atualizar os dados em qualquer momento.
        </div>
      )}

      <section className="rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">Documento de identificação</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Tipo</span>
            <select value={idType} onChange={(e) => setIdType(e.target.value as 'bi' | 'passport')}
              className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none">
              <option value="bi">Bilhete de Identidade</option>
              <option value="passport">Passaporte</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Número</span>
            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Ex: 123456789"
              className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Foto do documento</span>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => handleUpload(e, 'id_photo')}
            className="mt-1 block w-full text-sm text-text-2 file:mr-3 file:rounded-full file:border file:border-shell file:bg-white file:px-3 file:py-1.5 file:text-text-2 hover:file:border-ink" />
          {uploading === 'id_photo' && <p className="mt-1 text-[12px] text-text-3">A enviar…</p>}
          {idPhotoUrl && <p className="mt-1 text-[12px] text-green-700">✓ Documento enviado</p>}
        </label>

        <label className="mt-3 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Telefone (com indicativo, ex: +238 123 4567)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel"
            className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
        </label>
      </section>

      <section className="rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">Carta de condução (só para alugar carros)</h2>
        <p className="mt-1 text-[12px] text-text-3">Necessária apenas se quiseres alugar veículos.</p>

        <label className="mt-3 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Número</span>
          <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)}
            className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
        </label>

        <label className="mt-3 block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Foto da carta</span>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => handleUpload(e, 'license_photo')}
            className="mt-1 block w-full text-sm text-text-2 file:mr-3 file:rounded-full file:border file:border-shell file:bg-white file:px-3 file:py-1.5 file:text-text-2 hover:file:border-ink" />
          {uploading === 'license_photo' && <p className="mt-1 text-[12px] text-text-3">A enviar…</p>}
          {licensePhotoUrl && <p className="mt-1 text-[12px] text-green-700">✓ Carta enviada</p>}
        </label>
      </section>

      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {success && <p className="text-[13px] text-green-700">Identidade guardada com sucesso.</p>}

      <button onClick={handleSubmit} disabled={isPending || !!uploading}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50 sm:w-auto">
        {isPending ? 'A guardar…' : verified ? 'Atualizar identidade' : 'Confirmar identidade'}
      </button>
    </div>
  )
}
