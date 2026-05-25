import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingSettingsForm } from '@/components/listing-settings-form'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ListingSettingsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/listings/${id}/settings`)

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, owner_id, instant_booking, require_verification, payment_window_hours, payout_iban, payout_holder_name, payout_instructions')
    .eq('id', id)
    .maybeSingle()

  if (!listing) notFound()
  const l = listing as {
    id: string
    title: string
    owner_id: string
    instant_booking: boolean
    require_verification: boolean
    payment_window_hours: number
    payout_iban: string | null
    payout_holder_name: string | null
    payout_instructions: string | null
  }
  if (l.owner_id !== user.id) notFound()

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <Link href={`/listings/${id}`}
            className="inline-flex items-center gap-1 text-[13px] text-text-3 transition-colors hover:text-ink">
            ← Voltar ao anúncio
          </Link>
          <div className="mt-4 flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Definições
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl">
            {l.title}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-8">
        <ListingSettingsForm listingId={l.id} initial={l} />
      </section>
    </main>
  )
}
