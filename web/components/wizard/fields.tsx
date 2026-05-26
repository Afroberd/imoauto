'use client'

/**
 * Reusable form primitives for the listing wizard. Each field reads from a
 * shared `data` record and writes via `set(name, value)`. This keeps the
 * type-specific field files terse.
 */

export type WizardData = Record<string, unknown>
export type Setter = (name: string, value: unknown) => void

export const inputClass =
  'w-full rounded-lg border border-shell bg-white px-4 py-3 text-base text-text-1 placeholder-text-3 outline-none transition-colors focus:border-ink sm:py-2.5 sm:text-[15px]'

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium uppercase tracking-[0.12em] text-text-3">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-text-3">{hint}</p>}
    </div>
  )
}

export function TextField({
  data, set, name, label, required, placeholder, hint, maxLength,
}: {
  data: WizardData; set: Setter; name: string; label: string
  required?: boolean; placeholder?: string; hint?: string; maxLength?: number
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <input
        type="text"
        value={(data[name] as string) ?? ''}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={inputClass}
      />
    </Field>
  )
}

export function TextArea({
  data, set, name, label, required, placeholder, rows = 4,
}: {
  data: WizardData; set: Setter; name: string; label: string
  required?: boolean; placeholder?: string; rows?: number
}) {
  return (
    <Field label={label} required={required}>
      <textarea
        value={(data[name] as string) ?? ''}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={inputClass}
      />
    </Field>
  )
}

export function NumberField({
  data, set, name, label, required, placeholder, hint, min, max, suffix,
}: {
  data: WizardData; set: Setter; name: string; label: string
  required?: boolean; placeholder?: string; hint?: string
  min?: number; max?: number; suffix?: string
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={(data[name] as string | number) ?? ''}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step="any"
          className={`${inputClass} tnum ${suffix ? 'pr-14' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] uppercase tracking-[0.12em] text-text-3">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  )
}

export function SelectField({
  data, set, name, label, required, options, placeholder = 'Escolhe…', hint,
}: {
  data: WizardData; set: Setter; name: string; label: string
  required?: boolean; hint?: string; placeholder?: string
  options: readonly { value: string; label: string }[]
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <select
        value={(data[name] as string) ?? ''}
        onChange={(e) => set(name, e.target.value)}
        className={inputClass}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  )
}

/** Multi-select chips. Stores a string[] under `name`. */
export function ChipGroup({
  data, set, name, label, options, hint,
}: {
  data: WizardData; set: Setter; name: string; label: string; hint?: string
  options: readonly { value: string; label: string }[]
}) {
  const selected = (data[name] as string[]) ?? []
  function toggle(value: string) {
    set(name, selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value])
  }
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                on
                  ? 'border-ink bg-ink text-paper'
                  : 'border-shell bg-white text-text-2 hover:border-line-strong hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

/** Single boolean toggle row. */
export function ToggleField({
  data, set, name, label, hint,
}: {
  data: WizardData; set: Setter; name: string; label: string; hint?: string
}) {
  const on = data[name] === true
  return (
    <button
      type="button"
      onClick={() => set(name, !on)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-shell bg-white px-4 py-3 text-left transition-colors hover:border-line-strong"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-text-3">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          on ? 'bg-ink' : 'bg-shell'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
}
