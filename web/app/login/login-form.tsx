'use client'

import { useActionState } from 'react'
import { signIn, signInWithGoogle, type AuthState } from '@/app/actions/auth'
import { GoogleIcon } from '@/components/icons'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    undefined,
  )

  return (
    <div className="space-y-5">
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-shell bg-white px-4 py-3 text-sm font-medium text-ink shadow-[var(--shadow-card)] transition-all hover:border-line-strong hover:shadow-[var(--shadow-card-hover)]"
        >
          <GoogleIcon className="h-4 w-4" />
          Continuar com Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-text-3">
        <span className="h-px flex-1 bg-shell" />
        ou
        <span className="h-px flex-1 bg-shell" />
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@exemplo.cv"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-coral-deep">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 placeholder-text-3 outline-none transition-colors focus:border-ink'
