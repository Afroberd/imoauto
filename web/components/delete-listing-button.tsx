'use client'

import { deleteListing } from '@/app/actions/listings'

export function DeleteListingButton({ id, title }: { id: string; title: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Tens a certeza que queres apagar o anúncio "${title}"?\n\nIsto também elimina as fotos. Não há reversão.`,
    )
    if (!confirmed) e.preventDefault()
  }

  return (
    <form action={deleteListing} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-shell px-3 py-1.5 text-[12px] text-coral-deep transition-colors hover:border-coral hover:bg-coral-soft"
      >
        Apagar
      </button>
    </form>
  )
}
