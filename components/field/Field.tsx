'use client'

import { useId } from 'react'

/**
 * Controls only. Nothing here computes anything; the container calls the
 * engine and hands the result down.
 */

/**
 * The hint is where this app does its most important work — "Asumsi Anda,
 * bukan data", "tidak dikirim ke mana pun", "diserahkan BI kepada kebijakan
 * bank". Rendering it as a loose paragraph next to the input meant a screen
 * reader never read it out with the field it qualifies. aria-describedby is
 * the native association for exactly this (WCAG 1.3.1).
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
  const hintId = `${id}-hint`
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={`field-label block ${amber ? 'text-unknown' : 'text-annotation'}`}>
        {label}
      </label>
      <div className="flex items-center rounded-md border border-annotation/40 bg-recess transition-colors focus-within:border-annotation hover:border-annotation/70">
        <span className="figure px-3 py-2 text-muted">Rp</span>
        <input
          id={id}
          aria-describedby={hint ? hintId : undefined}
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
      {hint && (
        <p id={hintId} className={`text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>
          {hint}
        </p>
      )}
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
  const hintId = `${id}-hint`
  const percent = Number((value * 100).toFixed(4))
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={`field-label block ${amber ? 'text-unknown' : 'text-annotation'}`}>
        {label}
      </label>
      <div className="flex items-center rounded-md border border-annotation/40 bg-recess transition-colors focus-within:border-annotation hover:border-annotation/70">
        <input
          id={id}
          aria-describedby={hint ? hintId : undefined}
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
      {hint && (
        <p id={hintId} className={`text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>
          {hint}
        </p>
      )}
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
  presets,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  suffix?: string
  hint?: string
  /**
   * Common counts offered as one tap — tenor and fixed-period years, never a
   * rate. The typed field stays underneath for anything else.
   */
  presets?: readonly number[]
}) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="field-label block text-annotation">
        {label}
      </label>
      {presets && (
        <div role="group" aria-label={label} className="flex overflow-hidden rounded-md border border-annotation/40">
          {presets
            .filter((preset) => preset >= min && preset <= max)
            .map((preset, index) => (
              <button
                key={preset}
                type="button"
                aria-pressed={value === preset}
                onClick={() => onChange(preset)}
                className={`figure flex-1 py-1.5 text-caption transition-colors ${
                  index > 0 ? 'border-l border-annotation/25' : ''
                } ${
                  value === preset
                    ? 'bg-raised text-print shadow-[inset_0_-2px_0_rgb(var(--c-annotation))]'
                    : 'text-muted hover:bg-surface hover:text-print'
                }`}
              >
                {preset}
              </button>
            ))}
        </div>
      )}
      <div className="flex items-center rounded-md border border-annotation/40 bg-recess transition-colors focus-within:border-annotation hover:border-annotation/70">
        <input
          id={id}
          aria-describedby={hint ? hintId : undefined}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="figure w-full bg-transparent px-3 py-2 text-right text-print outline-none"
        />
        {suffix && <span className="figure px-3 py-2 text-muted">{suffix}</span>}
      </div>
      {hint && (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      )}
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
  const hintId = `${id}-hint`
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="field-label block text-annotation">
        {label}
      </label>
      <select
        id={id}
        aria-describedby={hint ? hintId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-md border border-annotation/40 bg-recess px-3 py-2 text-print outline-none transition-colors hover:border-annotation/70 focus:border-annotation"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-recess">
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

/**
 * A second handle on the assumed floating rate, for trying several figures
 * quickly — which the step note asks the user to do. It edits the same value
 * as the typed field and starts wherever that field is, including zero: it
 * never proposes a position of its own.
 *
 * The hatched region is the band the user asked to see (rate minus the lower
 * spread, rate plus the upper one), drawn to the same scale as the track.
 * The positions are a straight percentage of the track — a layout scale, not
 * a figure anyone reads.
 */
export function RateBandSlider({
  label,
  value,
  lower,
  upper,
  onChange,
  max = 0.2,
}: {
  label: string
  value: number
  /** How far below `value` the band reaches, as a decimal. */
  lower: number
  /** How far above `value` the band reaches, as a decimal. */
  upper: number
  onChange: (value: number) => void
  max?: number
}) {
  const at = (rate: number) => `${(Math.min(Math.max(rate, 0), max) / max) * 100}%`
  const bandFrom = Math.max(value - Math.abs(lower), 0)
  const bandTo = value + Math.abs(upper)
  const showBand = value > 0 && bandTo > bandFrom
  const ticks = [0, 0.05, 0.1, 0.15, 0.2].filter((tick) => tick <= max)

  return (
    <div className="pt-1">
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-annotation/30" />
        {showBand && (
          <div
            aria-hidden
            className="hatch-unknown absolute top-1/2 h-3 -translate-y-1/2 rounded-sm border border-unknown"
            style={{ left: at(bandFrom), width: `calc(${at(bandTo)} - ${at(bandFrom)})` }}
          />
        )}
        <input
          type="range"
          aria-label={label}
          min={0}
          max={max * 100}
          step={0.25}
          value={Math.min(value * 100, max * 100)}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
          className="rate-slider absolute inset-0 w-full"
        />
      </div>
      <div aria-hidden className="figure mt-1 flex justify-between text-micro text-muted">
        {ticks.map((tick) => (
          <span key={tick}>{Math.round(tick * 100)}%</span>
        ))}
      </div>
    </div>
  )
}
