import Link from 'next/link'
import { Wordmark } from '@/components/wordmark'
import { ForgotForm } from './forgot-form'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const sp = await searchParams
  const sent = sp.sent === '1'

  return (
    <main className="min-h-screen bg-paper">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Wordmark />

          <h2 className="mt-8 font-display text-3xl font-medium text-ink">
            Recuperar password
          </h2>

          {sent ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-md border border-success/30 bg-success-soft px-3 py-3 text-sm text-success">
                Se existir uma conta com esse email, enviámos um link para
                redefinir a password. Verifica a tua caixa de entrada (e a pasta
                de spam).
              </div>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-shell bg-white px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                Voltar a entrar
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-text-2">
                Indica o teu email e enviamos-te um link para criar uma nova
                password.
              </p>

              <div className="mt-8">
                <ForgotForm />
              </div>

              <p className="mt-8 text-center text-sm text-text-2">
                Lembraste-te?{' '}
                <Link
                  href="/login"
                  className="font-medium text-ink underline-offset-4 hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
