'use client'

import { useActionState } from 'react'
import { requestPasswordReset, type AuthState } from '@/app/actions/auth'

const inputClass =
  'w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 placeholder-text-3 outline-none transition-colors focus:border-ink'

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    undefined,
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3"
        >
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

      {state?.error && <p className="text-sm text-coral-deep">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'A enviar…' : 'Enviar link de recuperação'}
      </button>
    </form>
  )
}
