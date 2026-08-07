'use client'

import { useId } from 'react'

/**
 * Controls only. Nothing here computes anything; the container calls the
 * engine and hands the result down.
 */

export function MoneyField({
  label,
  value,
  onChange,
  hint,
  amber,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  amber?: boolean
}) {
  const id = useId()
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={`sheet-label block text-caption ${amber ? 'text-unknown' : 'text-annotation'}`}>
        {label}
      </label>
      <div className="flex items-center border border-annotation/40 bg-recess focus-within:border-annotation">
        <span className="figure px-3 py-2 text-muted">Rp</span>
        <input
          id={id}
          inputMode="numeric"
          value={value === 0 ? '' : new Intl.NumberFormat('id-ID').format(value)}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '')
            onChange(digits === '' ? 0 : Number(digits))
          }}
          className={`figure w-full bg-transparent py-2 pr-3 text-right outline-none ${
            amber ? 'text-unknown' : 'text-print'
          }`}
        />
      </div>
      {hint && <p className={`text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>{hint}</p>}
    </div>
  )
}

export function RateField({
  label,
  value,
  onChange,
  hint,
  amber,
  step = 0.05,
  max = 40,
}: {
  label: string
  /** A decimal, e.g. 0.115. The control shows and edits percent. */
  value: number
  onChange: (value: number) => void
  hint?: string
  amber?: boolean
  step?: number
  max?: number
}) {
  const id = useId()
  const percent = Number((value * 100).toFixed(4))
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={`sheet-label block text-caption ${amber ? 'text-unknown' : 'text-annotation'}`}>
        {label}
      </label>
      <div className="flex items-center border border-annotation/40 bg-recess focus-within:border-annotation">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={0}
          max={max}
          value={Number.isFinite(percent) ? percent : 0}
          onChange={(event) => {
            const next = Number(event.target.value)
            onChange(Number.isFinite(next) ? Math.max(0, next) / 100 : 0)
          }}
          className={`figure w-full bg-transparent px-3 py-2 text-right outline-none ${
            amber ? 'text-unknown' : 'text-print'
          }`}
        />
        <span className="figure px-3 py-2 text-muted">%</span>
      </div>
      {hint && <p className={`text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>{hint}</p>}
    </div>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 40,
  suffix,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  suffix?: string
  hint?: string
}) {
  const id = useId()
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sheet-label block text-caption text-annotation">
        {label}
      </label>
      <div className="flex items-center border border-annotation/40 bg-recess focus-within:border-annotation">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="figure w-full bg-transparent px-3 py-2 text-right text-print outline-none"
        />
        {suffix && <span className="figure px-3 py-2 text-muted">{suffix}</span>}
      </div>
      {hint && <p className="text-caption text-muted">{hint}</p>}
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string
  value: T
  options: readonly { readonly value: T; readonly label: string }[]
  onChange: (value: T) => void
  hint?: string
}) {
  const id = useId()
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sheet-label block text-caption text-annotation">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full border border-annotation/40 bg-recess px-3 py-2 text-print outline-none focus:border-annotation"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-recess">
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-caption text-muted">{hint}</p>}
    </div>
  )
}
