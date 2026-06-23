import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { getUnreadCount } from '@/app/actions/notifications'
import { Wordmark } from '@/components/wordmark'
import { PlusIcon, HeartIcon, MessageIcon, CalendarIcon } from '@/components/icons'
import { MobileNav } from '@/components/mobile-nav'
import { NotificationBell } from '@/components/notification-bell'

const baseLinks = [
  { href: '/listings', label: 'Anúncios' },
  { href: '/listings?kind=property', label: 'Imóveis' },
  { href: '/listings?kind=vehicle', label: 'Automóveis' },
]

const loggedInLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/reservas', label: 'As minhas reservas' },
  { href: '/messages', label: 'Mensagens' },
  { href: '/my-favorites', label: 'Favoritos' },
  { href: '/my-listings', label: 'Os meus anúncios' },
  { href: '/listings/new', label: '+ Anunciar' },
  { href: '/verificacao', label: 'Verificação' },
  { href: '/profile', label: 'Conta' },
]

const loggedOutLinks = [
  { href: '/login', label: 'Entrar' },
  { href: '/register', label: 'Criar conta' },
]

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const unread = user ? await getUnreadCount() : 0

  return (
    <header className="sticky top-0 z-30 border-b border-shell/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
        {/* Left — logo + main nav (desktop) */}
        <div className="flex items-center gap-6 md:gap-8">
          <Wordmark />
          <nav className="hidden items-center gap-6 text-sm text-text-2 md:flex">
            {baseLinks.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2">
          {/* Desktop: full nav */}
          <nav className="hidden items-center gap-2 text-sm md:flex">
            {user ? (
              <>
                <Link
                  href="/listings/new"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-paper transition-colors hover:bg-ink-deep"
                >
                  <PlusIcon className="h-4 w-4" />
                  Anunciar
                </Link>
                <Link href="/my-favorites" aria-label="Favoritos"
                  className="inline-flex items-center rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink">
                  <HeartIcon className="h-4 w-4" />
                </Link>
                <Link href="/messages" aria-label="Mensagens"
                  className="inline-flex items-center rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink">
                  <MessageIcon className="h-4 w-4" />
                </Link>
                <Link href="/dashboard/reservas" aria-label="As minhas reservas"
                  className="inline-flex items-center rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink">
                  <CalendarIcon className="h-4 w-4" />
                </Link>
                <NotificationBell userId={user.id} initialUnread={unread} />
                <Link href="/dashboard"
                  className="rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink">
                  Dashboard
                </Link>
                <Link href="/my-listings"
                  className="hidden rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink lg:inline-block">
                  Os meus
                </Link>
                <Link href="/profile"
                  className="hidden rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink lg:inline-block">
                  Conta
                </Link>
                <form action={signOut}>
                  <button type="submit"
                    className="rounded-full border border-shell px-3 py-2 text-text-2 transition-colors hover:border-ink hover:text-ink">
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login"
                  className="rounded-full px-3 py-2 text-text-2 transition-colors hover:text-ink">
                  Entrar
                </Link>
                <Link href="/register"
                  className="rounded-full bg-ink px-4 py-2 text-paper transition-colors hover:bg-ink-deep">
                  Criar conta
                </Link>
              </>
            )}
          </nav>

          {/* Mobile: notification bell + hamburger menu */}
          {user && (
            <div className="md:hidden">
              <NotificationBell userId={user.id} initialUnread={unread} />
            </div>
          )}
          <MobileNav
            loggedIn={!!user}
            baseLinks={baseLinks}
            loggedInLinks={loggedInLinks}
            loggedOutLinks={loggedOutLinks}
          />
        </div>
      </div>
    </header>
  )
}
