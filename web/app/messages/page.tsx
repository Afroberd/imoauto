import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { MessageIcon } from '@/components/icons'

export const metadata = { robots: { index: false, follow: false } }

export const dynamic = 'force-dynamic'

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/messages')

  const { data: rows } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id, last_message_at, last_message_body, listing:listings(id, title, cover_image_url)')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  // Supabase's TS inference can mark the joined relation as an array even
  // though conversations.listing_id is many-to-one. Cast through unknown.
  const conversations = (rows ?? []) as unknown as {
    id: string
    buyer_id: string
    seller_id: string
    last_message_at: string | null
    last_message_body: string | null
    listing: { id: string; title: string; cover_image_url: string | null } | null
  }[]

  return (
    <main className="bg-paper">
      {/* Header */}
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-text-3 sm:tracking-[0.22em]">
            <span className="h-px w-8 bg-line-strong" />
            Mensagens
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl md:text-5xl">
            Conversas
          </h1>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-shell bg-white px-3 py-1.5 text-[12px] text-text-2 shadow-[var(--shadow-card)]">
            <MessageIcon className="h-3.5 w-3.5 text-text-3" />
            <span className="tnum">{conversations.length}</span>
            <span>{conversations.length === 1 ? 'conversa' : 'conversas'}</span>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        {conversations.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-shell">
            {conversations.map((conv) => {
              const listing = conv.listing
              const isBuyer = conv.buyer_id === user.id
              const role = isBuyer ? 'Comprador' : 'Vendedor'

              return (
                <li key={conv.id}>
                  <Link
                    href={`/messages/${conv.id}`}
                    className="flex items-center gap-4 py-4 transition-colors hover:bg-paper-soft -mx-3 px-3 rounded-[var(--radius-card)]"
                  >
                    {/* Listing thumbnail */}
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-shell">
                      {listing?.cover_image_url ? (
                        <Image
                          src={listing.cover_image_url}
                          alt={listing?.title ?? ''}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <MessageIcon className="h-6 w-6 text-text-3" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {listing?.title ?? 'Anúncio removido'}
                        </p>
                        {conv.last_message_at && (
                          <span className="flex-shrink-0 text-[12px] text-text-3 tnum">
                            {relativeTime(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-text-3">{role}</p>
                      {conv.last_message_body ? (
                        <p className="mt-1 truncate text-[13px] text-text-2">
                          {conv.last_message_body}
                        </p>
                      ) : (
                        <p className="mt-1 text-[13px] italic text-text-3">
                          Ainda sem mensagens.
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-20 text-center">
      <MessageIcon className="mx-auto h-10 w-10 text-text-3" />
      <h2 className="mt-4 font-display text-2xl text-ink">Ainda sem conversas.</h2>
      <p className="mx-auto mt-2 max-w-md text-text-2">
        Contacta um anunciante em qualquer anúncio para iniciar uma conversa.
      </p>
      <Link
        href="/listings"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
      >
        Explorar anúncios
      </Link>
    </div>
  )
}
