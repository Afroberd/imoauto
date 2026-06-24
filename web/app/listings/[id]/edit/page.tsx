import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserVerified } from '@/app/actions/verification'
import { ListingWizard } from '@/app/listings/new/listing-wizard'
import type { Listing } from '@/lib/listings/types'
import type { WizardData } from '@/components/wizard/fields'

export const dynamic = 'force-dynamic'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/listings/${id}/edit`)

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!listing) notFound()
  const l = listing as Listing
  if (l.owner_id !== user.id) notFound() // only the owner can edit

  const isVerified = await isCurrentUserVerified()

  // Flatten listing + attributes into the wizard's flat data record.
  const data: WizardData = {
    title: l.title ?? '',
    description: l.description ?? '',
    price_cve: l.price_cve ?? '',
    location_island: l.location_island ?? '',
    location_municipality: l.location_municipality ?? '',
    location_city: l.location_city ?? '',
    latitude: l.latitude ?? '',
    longitude: l.longitude ?? '',
    contact_phone: l.contact_phone ?? '',
    ...(l.attributes ?? {}),
  }

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-text-3 sm:text-[12px] sm:tracking-[0.22em]">
            <span className="h-px w-6 bg-line-strong sm:w-8" />
            Editar anúncio
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl md:text-5xl">
            {l.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-text-2 sm:text-base">
            Edita os detalhes. A gestão de fotos faz-se em separado — as fotos
            atuais mantêm-se.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
        <ListingWizard
          userId={user.id}
          mode="edit"
          listingId={l.id}
          initial={{ kind: l.kind, purpose: l.purpose, data }}
          isVerified={isVerified}
        />
      </section>
    </main>
  )
}
