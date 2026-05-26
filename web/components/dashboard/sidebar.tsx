'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarIcon, MessageIcon, HouseIcon, CarIcon, AreaIcon,
} from '@/components/icons'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

const items: NavItem[] = [
  { href: '/dashboard',          label: 'Hoje',         icon: <AreaIcon className="h-4 w-4" />, exact: true },
  { href: '/dashboard/reservas', label: 'As minhas reservas', icon: <CalendarIcon className="h-4 w-4" /> },
  { href: '/dashboard/requests', label: 'Pedidos recebidos',  icon: <MessageIcon className="h-4 w-4" /> },
  { href: '/dashboard/stays',    label: 'Estadias',     icon: <HouseIcon className="h-4 w-4" /> },
  { href: '/dashboard/payments', label: 'Pagamentos',   icon: <CarIcon className="h-4 w-4" /> },
  { href: '/dashboard/calendar', label: 'Calendário',   icon: <CalendarIcon className="h-4 w-4" /> },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-full md:w-56 md:flex-shrink-0">
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-ink text-paper'
                  : 'text-text-2 hover:bg-shell-soft hover:text-ink'
              }`}
            >
              <span className={active ? 'text-paper' : 'text-text-3'}>{it.icon}</span>
              {it.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
