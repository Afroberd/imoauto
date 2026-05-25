'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startConversation } from '@/app/actions/messages'
import { MessageIcon } from '@/components/icons'

interface Props {
  listingId: string
}

export function ContactSellerButton({ listingId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await startConversation(listingId)
      if (!result.ok) {
        if (result.error === 'unauthenticated') {
          router.push(`/login?next=/listings/${listingId}`)
          return
        }
        // 'owner' or other errors: button should not appear for owners, ignore
        return
      }
      router.push(`/messages/${result.conversationId}`)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
    >
      <MessageIcon className="h-4 w-4" />
      {isPending ? 'A abrir conversa…' : 'Enviar mensagem'}
    </button>
  )
}
