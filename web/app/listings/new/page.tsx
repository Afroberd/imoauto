import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingWizard } from './listing-wizard'

export default async function NewListingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/listings/new')

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Novo anúncio
          </div>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-[-0.022em] text-ink sm:text-5xl">
            Publicar é gratuito.
          </h1>
          <p className="mt-3 max-w-xl text-text-2">
            Seis passos curtos. O formulário adapta-se ao que estás a anunciar —
            uma venda de carro não pede o mesmo que uma estadia.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-12">
        <ListingWizard userId={user.id} mode="create" />
      </section>
    </main>
  )
}
