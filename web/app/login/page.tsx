import Link from 'next/link'
import { LoginForm } from './login-form'
import { Wordmark } from '@/components/wordmark'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string; next?: string }>
}) {
  const sp = await searchParams

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
        {/* Decorative panel */}
        <aside className="surface-ink relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
          <Wordmark tone="paper" />

          <div>
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-paper/70">
              <span className="h-px w-8 bg-paper/30" />
              Bem-vindo de volta
            </div>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.04] tracking-[-0.022em] text-paper">
              O Atlântico,<br />
              <span className="italic text-coral">à tua porta.</span>
            </h1>
            <p className="mt-5 max-w-md text-paper/70">
              Entra para gerir os teus anúncios, contactar anunciantes e seguir as
              casas e carros que te interessam.
            </p>
          </div>

          <DecorativeSky />
        </aside>

        {/* Form */}
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8">
              <Wordmark />
            </div>

            <h2 className="font-display text-3xl font-medium text-ink">Entrar</h2>
            <p className="mt-1 text-sm text-text-2">
              Acede à tua conta IMOAUTO.
            </p>

            {sp.registered && (
              <div className="mt-6 rounded-md border border-success/30 bg-success-soft px-3 py-2 text-sm text-success">
                Conta criada. Entra para continuar.
              </div>
            )}
            {sp.error && (
              <div className="mt-6 rounded-md border border-coral/30 bg-coral-soft px-3 py-2 text-sm text-coral-deep">
                Falha na autenticação. Tenta novamente.
              </div>
            )}

            <div className="mt-8">
              <LoginForm />
            </div>

            <p className="mt-8 text-center text-sm text-text-2">
              Ainda não tens conta?{' '}
              <Link href="/register" className="font-medium text-ink underline-offset-4 hover:underline">
                Cria uma
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
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
        <radialGradient id="sun-l" cx="0.75" cy="0.2" r="0.4">
          <stop offset="0%" stopColor="#E76B4F" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E76B4F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="400" fill="url(#sun-l)" />
      <circle cx="450" cy="120" r="40" fill="#E76B4F" opacity="0.95" />
      <path d="M0,260 Q150,210 300,250 T600,250 L600,400 L0,400 Z" fill="#1E445C" opacity="0.6" />
      <path d="M0,300 Q150,260 300,290 T600,290 L600,400 L0,400 Z" fill="#0B2E40" opacity="0.7" />
      <path d="M0,340 Q150,310 300,330 T600,330 L600,400 L0,400 Z" fill="#061C29" />
    </svg>
  )
}
