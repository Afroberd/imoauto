'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarIcon, MessageIcon, HouseIcon, CarIcon, AreaIcon,
} from '@/components/icons'

interface NavItem {
  href: string
  label: string
  shortLabel?: string
  icon: React.ReactNode
  exact?: boolean
}

const items: NavItem[] = [
  { href: '/dashboard',          label: 'Hoje',                shortLabel: 'Hoje',     icon: <AreaIcon className="h-4 w-4" />, exact: true },
  { href: '/dashboard/reservas', label: 'As minhas reservas',  shortLabel: 'Reservas', icon: <CalendarIcon className="h-4 w-4" /> },
  { href: '/dashboard/requests', label: 'Pedidos recebidos',   shortLabel: 'Pedidos',  icon: <MessageIcon className="h-4 w-4" /> },
  { href: '/dashboard/stays',    label: 'Estadias',            shortLabel: 'Estadias', icon: <HouseIcon className="h-4 w-4" /> },
  { href: '/dashboard/payments', label: 'Pagamentos',          shortLabel: 'Pagamentos', icon: <CarIcon className="h-4 w-4" /> },
  { href: '/dashboard/calendar', label: 'Calendário',          shortLabel: 'Calendário', icon: <CalendarIcon className="h-4 w-4" /> },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  return (
    <aside className="-mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-56 md:flex-shrink-0">
      <nav className="flex flex-row gap-1.5 overflow-x-auto px-4 pb-1 md:flex-col md:px-0 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-ink text-paper'
                  : 'text-text-2 hover:bg-shell-soft hover:text-ink'
              }`}
            >
              <span className={active ? 'text-paper' : 'text-text-3'}>{it.icon}</span>
              <span className="md:hidden">{it.shortLabel ?? it.label}</span>
              <span className="hidden md:inline">{it.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
