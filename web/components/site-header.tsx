import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { Wordmark } from '@/components/wordmark'
import { PlusIcon, HeartIcon, MessageIcon, CalendarIcon } from '@/components/icons'

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-30 border-b border-shell/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <div className="flex items-center gap-8">
          <Wordmark />
          <nav className="hidden items-center gap-6 text-sm text-text-2 md:flex">
            <Link href="/listings" className="transition-colors hover:text-ink">
              Anúncios
            </Link>
            <Link href="/listings?kind=property" className="transition-colors hover:text-ink">
              Imóveis
            </Link>
            <Link href="/listings?kind=vehicle" className="transition-colors hover:text-ink">
              Automóveis
            </Link>
          </nav>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/listings/new"
                className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-paper transition-colors hover:bg-ink-deep sm:inline-flex"
              >
                <PlusIcon className="h-4 w-4" />
                Anunciar
              </Link>
              <Link
                href="/my-favorites"
                className="hidden items-center gap-1 rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink md:inline-flex"
                aria-label="Favoritos"
              >
                <HeartIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/messages"
                className="hidden items-center gap-1 rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink md:inline-flex"
                aria-label="Mensagens"
              >
                <MessageIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/bookings"
                className="hidden items-center gap-1 rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink md:inline-flex"
                aria-label="Reservas"
              >
                <CalendarIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="hidden rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink md:inline-block"
              >
                Dashboard
              </Link>
              <Link
                href="/my-listings"
                className="hidden rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink md:inline-block"
              >
                Os meus
              </Link>
              <Link
                href="/verificacao"
                className="hidden rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink lg:inline-block"
              >
                Verificação
              </Link>
              <Link
                href="/profile"
                className="hidden rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink sm:inline-block"
              >
                Conta
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-shell px-3 py-2 text-text-2 transition-colors hover:border-ink hover:text-ink"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-text-2 transition-colors hover:text-ink"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-ink px-4 py-2 text-paper transition-colors hover:bg-ink-deep"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
