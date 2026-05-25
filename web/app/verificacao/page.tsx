import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyVerification } from '@/app/actions/verification'
import { VerificationForm } from '@/components/verification-form'

export const dynamic = 'force-dynamic'

export default async function VerificationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/verificacao')

  const existing = await getMyVerification()

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Segurança
          </div>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-[-0.022em] text-ink sm:text-5xl">
            Verificar identidade
          </h1>
          <p className="mt-3 max-w-xl text-sm text-text-2">
            Para proteger anfitriões e hóspedes, os anúncios que exigem verificação só aceitam reservas
            de utilizadores com identidade confirmada. Os documentos ficam guardados de forma privada —
            só tu e o anfitrião da tua reserva conseguem ver.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-8">
        <VerificationForm
          userId={user.id}
          existing={existing as Parameters<typeof VerificationForm>[0]['existing']}
        />
      </section>
    </main>
  )
}
