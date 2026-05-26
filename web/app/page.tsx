import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import { ArrowRightIcon, SearchIcon, HouseIcon, CarIcon } from '@/components/icons'
import { CV_ISLANDS } from '@/lib/listings/constants'
import type { Listing } from '@/lib/listings/types'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)
  const featured = (data ?? []) as Listing[]

  return (
    <main className="bg-paper">
      {/* — HERO — */}
      <section className="bg-atlantic relative overflow-hidden">
        <div aria-hidden className="bg-topo absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24 md:pb-28 md:pt-32">
          <div className="flex flex-col items-start gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3 rise">
            <span className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-line-strong" />
              Cabo Verde · 2026
            </span>
          </div>

          <h1 className="rise rise-delay-1 mt-6 max-w-4xl font-display text-[44px] font-medium leading-[0.98] tracking-[-0.025em] text-ink sm:text-[60px] md:text-[76px]">
            Casas e carros{' '}
            <span className="italic text-ink-soft">por toda</span>{' '}
            <br className="hidden sm:block" />
            a República das ilhas.
          </h1>

          <p className="rise rise-delay-2 mt-8 max-w-xl text-[17px] leading-relaxed text-text-2">
            O marketplace atlântico para comprar, vender e alugar — diário ou mensal —
            em todas as nove ilhas. Preços em escudo cabo-verdiano.
          </p>

          {/* Search bar */}
          <form
            action="/listings"
            method="GET"
            className="rise rise-delay-3 mt-10 flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-shell bg-white p-2 shadow-[var(--shadow-card)] sm:flex-row sm:items-stretch"
          >
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-paper-soft sm:px-4">
              <SearchIcon className="h-4 w-4 text-text-3" />
              <select
                name="kind"
                defaultValue=""
                className="w-full appearance-none bg-transparent text-sm text-text-1 outline-none"
              >
                <option value="">Tudo</option>
                <option value="property">🏠 Imóveis</option>
                <option value="vehicle">🚗 Automóveis</option>
              </select>
            </label>
            <span aria-hidden className="hidden w-px self-stretch bg-line sm:block" />
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-paper-soft sm:px-4">
              <span className="text-[11px] uppercase tracking-[0.15em] text-text-3">Ilha</span>
              <select
                name="island"
                defaultValue=""
                className="w-full appearance-none bg-transparent text-sm text-text-1 outline-none"
              >
                <option value="">Todas</option>
                {CV_ISLANDS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep"
            >
              Procurar
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          {/* Decorative numerals — coordinates */}
          <div
            aria-hidden
            className="numeral pointer-events-none absolute right-6 top-6 hidden text-right text-text-3 md:block"
          >
            <div className="text-[11px] uppercase tracking-[0.22em]">N° atlântico</div>
            <div className="mt-1 text-2xl text-ink-soft tnum">14°55′ / 23°31′</div>
          </div>
        </div>
      </section>

      {/* — CATEGORIES — */}
      <section className="border-t border-shell/70 bg-paper">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden bg-shell md:grid-cols-2">
          <CategoryBlock
            num="01"
            title="Imóveis"
            blurb="Apartamentos, moradias, terrenos. Para comprar ou alugar — do diário ao mensal, tipo estadia."
            href="/listings?kind=property"
            icon={<HouseIcon className="h-5 w-5" />}
          />
          <CategoryBlock
            num="02"
            title="Automóveis"
            blurb="Carros, motas, comerciais. Venda directa ou aluguer por dias — pronto a circular nas ilhas."
            href="/listings?kind=vehicle"
            icon={<CarIcon className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* — FEATURED — */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
                <span className="h-px w-8 bg-line-strong" />
                Recentes
              </div>
              <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.02em] text-ink sm:text-4xl">
                Acabados de publicar
              </h2>
            </div>
            <Link
              href="/listings"
              className="hidden items-center gap-1 text-sm text-ink hover:gap-2 sm:inline-flex"
            >
              Ver todos <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* — DEEP ATLANTIC RIBBON — */}
      <section className="bg-deep-atlantic relative overflow-hidden border-y border-ink-deep">
        <div className="bg-topo absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.4fr_1fr] md:items-center md:py-24">
          <div>
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-paper/70">
              <span className="h-px w-8 bg-coral" />
              Atlântico, sem comissões
            </div>
            <h2 className="mt-3 font-display text-4xl font-medium leading-[1.05] tracking-[-0.022em] text-paper sm:text-5xl">
              Anuncia hoje.<br />
              <span className="italic text-coral">Sem intermediários.</span>
            </h2>
            <p className="mt-4 max-w-md text-paper/75">
              Contacta diretamente quem procura. Publicar é gratuito, sem comissões
              do IMOAUTO sobre as tuas transações.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link
              href="/listings/new"
              className="group inline-flex w-full items-center justify-between gap-3 rounded-full bg-coral px-6 py-4 text-paper transition-colors hover:bg-coral-deep md:w-auto"
            >
              <span className="font-medium">Publicar anúncio gratuito</span>
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 px-2 py-1 text-sm text-paper/80 transition-colors hover:text-paper"
            >
              Ou explorar primeiro
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        {/* Wave footer of section */}
        <svg
          viewBox="0 0 1440 60"
          className="absolute bottom-0 left-0 w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0,40 Q360,10 720,30 T1440,30 L1440,60 L0,60 Z" fill="#FAF7F0" opacity="0.06" />
          <path d="M0,50 Q360,30 720,45 T1440,45 L1440,60 L0,60 Z" fill="#FAF7F0" opacity="0.05" />
        </svg>
      </section>

      {/* — HOW IT WORKS — */}
      <section className="border-t border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Como funciona
          </div>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-medium tracking-[-0.02em] text-ink sm:text-4xl">
            Três passos para publicar — ou encontrar.
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <Step
              num="01"
              title="Cria uma conta"
              body="Email + password, ou continua com Google. Demora menos de um minuto."
            />
            <Step
              num="02"
              title="Anuncia ou pesquisa"
              body="Um anúncio claro chama atenção. Para procurar, filtra por ilha, tipo e preço em CVE."
            />
            <Step
              num="03"
              title="Combina diretamente"
              body="Sem intermediários: contacto direto entre anunciante e interessado. Aluguer ou venda, decides tu."
            />
          </div>
        </div>
      </section>

      {/* — ISLANDS — */}
      <section className="border-t border-shell/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-[1fr_2fr]">
          <div>
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
              <span className="h-px w-8 bg-line-strong" />
              Cobertura
            </div>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.02em] text-ink sm:text-4xl">
              As nove ilhas, num só sítio.
            </h2>
            <p className="mt-4 max-w-md text-text-2">
              Anúncios filtráveis por ilha — do norte de Santo Antão ao sul da Brava.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {CV_ISLANDS.map((island, i) => (
              <li key={island}>
                <Link
                  href={`/listings?island=${encodeURIComponent(island)}`}
                  className="group flex items-baseline gap-3 border-b border-shell/70 py-3 transition-colors hover:border-ink"
                >
                  <span className="numeral text-[13px] text-text-3 tnum">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-lg text-ink-soft transition-colors group-hover:text-ink">
                    {island}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

function CategoryBlock({
  num,
  title,
  blurb,
  href,
  icon,
}: {
  num: string
  title: string
  blurb: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between gap-10 bg-paper p-10 transition-colors hover:bg-paper-soft md:p-14"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="numeral text-[34px] text-text-3 tnum">{num}</span>
          <span className="text-ink-soft transition-transform group-hover:translate-x-1">
            {icon}
          </span>
        </div>
        <h3 className="mt-6 font-display text-2xl font-medium tracking-[-0.02em] text-ink sm:mt-8 sm:text-4xl md:text-5xl">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-text-2">{blurb}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-transform group-hover:translate-x-1">
        Ver anúncios <ArrowRightIcon className="h-4 w-4" />
      </span>
    </Link>
  )
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div>
      <span className="numeral text-[40px] text-coral tnum">{num}</span>
      <h3 className="mt-3 font-display text-2xl font-medium text-ink">{title}</h3>
      <p className="mt-2 text-text-2">{body}</p>
    </div>
  )
}
