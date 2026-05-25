import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { MessageThread } from './message-thread'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/messages/${id}`)

  // Fetch conversation — RLS ensures user is a participant
  const { data: convRow } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id, listing:listings(id, title, cover_image_url)')
    .eq('id', id)
    .maybeSingle()

  if (!convRow) notFound()

  const conv = convRow as {
    id: string
    buyer_id: string
    seller_id: string
    listing: { id: string; title: string; cover_image_url: string | null } | null
  }

  // Fetch initial messages (oldest first)
  const { data: msgRows } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  const messages = (msgRows ?? []) as {
    id: string
    sender_id: string
    body: string
    created_at: string
  }[]

  const isBuyer = conv.buyer_id === user.id
  const listing = conv.listing

  return (
    <div className="flex h-[calc(100dvh-73px)] flex-col bg-paper">
      {/* Conversation header */}
      <header className="flex flex-shrink-0 items-center gap-4 border-b border-shell bg-paper px-5 py-4">
        <Link
          href="/messages"
          className="text-[13px] text-text-3 transition-colors hover:text-ink"
        >
          ←
        </Link>

        {/* Listing thumbnail */}
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-shell">
          {listing?.cover_image_url ? (
            <Image
              src={listing.cover_image_url}
              alt={listing.title}
              fill
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          {listing ? (
            <Link
              href={`/listings/${listing.id}`}
              className="block truncate text-sm font-medium text-ink transition-colors hover:text-text-2"
            >
              {listing.title}
            </Link>
          ) : (
            <p className="truncate text-sm text-text-3 italic">Anúncio removido</p>
          )}
          <p className="text-[12px] text-text-3">
            {isBuyer ? 'Tu és o comprador' : 'Tu és o vendedor'}
          </p>
        </div>
      </header>

      {/* Thread */}
      <MessageThread
        conversationId={conv.id}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  )
}
