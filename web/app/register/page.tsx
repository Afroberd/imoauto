import Link from 'next/link'
import { RegisterForm } from './register-form'
import { Wordmark } from '@/components/wordmark'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const sp = await searchParams
  const next = sp.next && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/profile'
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* Form */}
        <section className="order-2 flex items-center justify-center p-6 sm:p-10 lg:order-1">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8">
              <Wordmark />
            </div>

            <h2 className="font-display text-3xl font-medium text-ink">Criar conta</h2>
            <p className="mt-1 text-sm text-text-2">
              Junta-te ao marketplace atlântico — gratuito para anunciar.
            </p>

            <div className="mt-8">
              <RegisterForm next={next} />
            </div>

            <p className="mt-8 text-center text-sm text-text-2">
              Já tens conta?{' '}
              <Link
                href={`/login${next !== '/profile' ? `?next=${encodeURIComponent(next)}` : ''}`}
                className="font-medium text-ink underline-offset-4 hover:underline"
              >
                Entrar
              </Link>
            </p>

            <p className="mt-6 text-center text-[11px] text-text-3">
              Ao criar conta concordas implicitamente com o uso do IMOAUTO para fins legais.
            </p>
          </div>
        </section>

        {/* Decorative panel */}
        <aside className="surface-ink relative order-1 hidden flex-col justify-between overflow-hidden p-10 lg:order-2 lg:flex">
          <div className="flex items-center justify-end">
            <Wordmark tone="paper" />
          </div>

          <div>
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-paper/70">
              <span className="h-px w-8 bg-paper/30" />
              Primeira vez por aqui?
            </div>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.04] tracking-[-0.022em] text-paper">
              Anuncia em<br />
              <span className="italic text-coral">três passos.</span>
            </h1>
            <ol className="mt-8 space-y-4 text-paper/85">
              <Bullet num="01" text="Cria conta — email + password ou Google." />
              <Bullet num="02" text="Publica o teu imóvel ou automóvel, com fotos." />
              <Bullet num="03" text="Recebe contactos diretos, sem comissões." />
            </ol>
          </div>

          <DecorativeSky />
        </aside>
      </div>
    </main>
  )
}

function Bullet({ num, text }: { num: string; text: string }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="numeral text-coral tnum">{num}</span>
      <span>{text}</span>
    </li>
  )
}

function DecorativeSky() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 400"
      className="pointer-events-none absolute inset-x-0 bottom-0 w-full"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <radialGradient id="sun-r" cx="0.25" cy="0.2" r="0.4">
          <stop offset="0%" stopColor="#E76B4F" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E76B4F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="400" fill="url(#sun-r)" />
      <circle cx="150" cy="120" r="40" fill="#E76B4F" opacity="0.95" />
      <path d="M0,260 Q150,210 300,250 T600,250 L600,400 L0,400 Z" fill="#1E445C" opacity="0.6" />
      <path d="M0,300 Q150,260 300,290 T600,290 L600,400 L0,400 Z" fill="#0B2E40" opacity="0.7" />
      <path d="M0,340 Q150,310 300,330 T600,330 L600,400 L0,400 Z" fill="#061C29" />
    </svg>
  )
}
