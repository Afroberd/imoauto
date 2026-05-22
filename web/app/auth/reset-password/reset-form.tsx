'use client'

import { useActionState } from 'react'
import { updatePassword, type AuthState } from '@/app/actions/auth'

const inputClass =
  'w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 placeholder-text-3 outline-none transition-colors focus:border-ink'

const labelClass =
  'text-[12px] font-medium uppercase tracking-[0.12em] text-text-3'

export function ResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    undefined,
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className={labelClass}>
          Nova password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="text-[12px] text-text-3">Pelo menos 8 caracteres.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className={labelClass}>
          Confirmar password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-coral-deep">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'A guardar…' : 'Guardar nova password'}
      </button>
    </form>
  )
}
