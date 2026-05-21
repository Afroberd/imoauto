import Link from 'next/link'
import { Wordmark } from '@/components/wordmark'
import { CV_ISLANDS } from '@/lib/listings/constants'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-shell/70 bg-paper-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Wordmark />
          <p className="max-w-xs text-sm leading-relaxed text-text-2">
            O marketplace atlântico. Imóveis e automóveis em todas as nove ilhas de Cabo Verde —
            compra, venda, aluguer.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-text-3">Anúncios</h4>
          <ul className="mt-4 space-y-2 text-sm text-text-2">
            <li><Link href="/listings" className="hover:text-ink">Todos</Link></li>
            <li><Link href="/listings?kind=property" className="hover:text-ink">Imóveis</Link></li>
            <li><Link href="/listings?kind=vehicle" className="hover:text-ink">Automóveis</Link></li>
            <li><Link href="/listings/new" className="hover:text-ink">Anunciar</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-text-3">Ilhas</h4>
          <ul className="mt-4 grid grid-cols-1 gap-1.5 text-sm text-text-2">
            {CV_ISLANDS.map((island, i) => (
              <li key={island} className="flex items-baseline gap-2">
                <span className="numeral text-[11px] text-text-3 tnum">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Link
                  href={`/listings?island=${encodeURIComponent(island)}`}
                  className="hover:text-ink"
                >
                  {island}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-text-3">Conta</h4>
          <ul className="mt-4 space-y-2 text-sm text-text-2">
            <li><Link href="/login" className="hover:text-ink">Entrar</Link></li>
            <li><Link href="/register" className="hover:text-ink">Criar conta</Link></li>
            <li><Link href="/my-listings" className="hover:text-ink">Os meus anúncios</Link></li>
            <li><Link href="/profile" className="hover:text-ink">Perfil</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-shell/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-text-3">
          <span>© {new Date().getFullYear()} Imo·auto · Cabo Verde</span>
          <span className="font-mono tnum tracking-tighter">
            14°55′N · 23°31′W
          </span>
        </div>
      </div>
    </footer>
  )
}
