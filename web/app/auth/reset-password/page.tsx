import Link from 'next/link'
import { Wordmark } from '@/components/wordmark'
import { createClient } from '@/lib/supabase/server'
import { ResetForm } from './reset-form'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-paper">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Wordmark />

          <h2 className="mt-8 font-display text-3xl font-medium text-ink">
            Nova password
          </h2>

          {user ? (
            <>
              <p className="mt-1 text-sm text-text-2">
                Escolhe uma nova password para a conta{' '}
                <span className="text-ink">{user.email}</span>.
              </p>
              <div className="mt-8">
                <ResetForm />
              </div>
            </>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-md border border-coral/30 bg-coral-soft px-3 py-3 text-sm text-coral-deep">
                O link de recuperação é inválido ou expirou. Pede um novo para
                continuar.
              </div>
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep"
              >
                Pedir novo link
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
