import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  // Flatten listing + attributes into the wizard's flat data record.
  const data: WizardData = {
    title: l.title ?? '',
    description: l.description ?? '',
    price_cve: l.price_cve ?? '',
    location_island: l.location_island ?? '',
    location_city: l.location_city ?? '',
    latitude: l.latitude ?? '',
    longitude: l.longitude ?? '',
    contact_phone: l.contact_phone ?? '',
    ...(l.attributes ?? {}),
  }

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Editar anúncio
          </div>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-[-0.022em] text-ink sm:text-5xl">
            {l.title}
          </h1>
          <p className="mt-3 max-w-xl text-text-2">
            Edita os detalhes. A gestão de fotos faz-se em separado — as fotos
            atuais mantêm-se.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-12">
        <ListingWizard
          userId={user.id}
          mode="edit"
          listingId={l.id}
          initial={{ kind: l.kind, purpose: l.purpose, data }}
        />
      </section>
    </main>
  )
}
