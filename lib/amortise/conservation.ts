import { add, subtract, sum, type Rupiah } from '@/lib/money/rupiah'
import { addMonths, periodsEqual } from '@/lib/period/period'
import type { Schedule, TraceStep } from './types'

/**
 * The backbone. Written before the amortisation loop it checks, so the
 * rounding bug is found the same hour it is written.
 *
 * Asserted on every schedule produced in every test — not only in
 * tests/conservation — and by the schedule builders themselves, so a schedule
 * that does not conserve can never be returned to a caller at all.
 */
export class ConservationError extends Error {
  constructor(
    message: string,
    readonly failures: readonly string[],
  ) {
    super(`${message}\n  - ${failures.join('\n  - ')}`)
    this.name = 'ConservationError'
  }
}

export interface ConservationReport {
  readonly checks: readonly string[]
  readonly failures: readonly string[]
}

export function checkConservation(schedule: Schedule): ConservationReport {
  const checks: string[] = []
  const failures: string[] = []

  const record = (description: string, ok: boolean, detail: string) => {
    if (ok) checks.push(`${description}: ${detail}`)
    else failures.push(`${description} GAGAL: ${detail}`)
  }

  const { instalments } = schedule

  if (instalments.length !== schedule.termMonths) {
    failures.push(
      `Jumlah angsuran ${instalments.length} tidak sama dengan tenor ${schedule.termMonths} bulan`,
    )
  }

  // 1. Principal payments sum to the principal exactly, to the rupiah.
  const principalPaid = sum(instalments.map((instalment) => instalment.principal))
  record(
    'Jumlah pembayaran pokok sama dengan plafon',
    principalPaid === schedule.principal,
    `${principalPaid} vs ${schedule.principal}`,
  )

  // 2. The final balance is exactly zero.
  const last = instalments[instalments.length - 1]
  record(
    'Saldo akhir tepat nol',
    last !== undefined && last.closingBalance === 0,
    `${last?.closingBalance ?? 'tidak ada angsuran'}`,
  )

  // 3. Total paid equals principal plus total interest.
  const interestPaid = sum(instalments.map((instalment) => instalment.interest))
  record(
    'Total interest sama dengan jumlah bunga per angsuran',
    interestPaid === schedule.totalInterest,
    `${interestPaid} vs ${schedule.totalInterest}`,
  )
  record(
    'Total dibayar sama dengan plafon ditambah total bunga',
    schedule.totalPaid === add(schedule.principal, schedule.totalInterest),
    `${schedule.totalPaid} vs ${add(schedule.principal, schedule.totalInterest)}`,
  )
  const paymentsPaid = sum(instalments.map((instalment) => instalment.payment))
  record(
    'Jumlah angsuran sama dengan total dibayar',
    paymentsPaid === schedule.totalPaid,
    `${paymentsPaid} vs ${schedule.totalPaid}`,
  )

  // 4. Each row is internally consistent and the balances chain.
  let expectedOpening: Rupiah = schedule.principal
  let rowFailures = 0
  for (const [offset, instalment] of instalments.entries()) {
    const problems: string[] = []
    if (instalment.openingBalance !== expectedOpening) {
      problems.push(`saldo awal ${instalment.openingBalance} ≠ ${expectedOpening}`)
    }
    if (instalment.payment !== add(instalment.interest, instalment.principal)) {
      problems.push('angsuran ≠ bunga + pokok')
    }
    if (instalment.closingBalance !== subtract(instalment.openingBalance, instalment.principal)) {
      problems.push('saldo akhir ≠ saldo awal − pokok')
    }
    if (instalment.closingBalance < 0) problems.push('saldo akhir negatif')
    if (instalment.index !== offset + 1) problems.push(`nomor angsuran ${instalment.index}`)
    if (!periodsEqual(instalment.period, addMonths(schedule.start, offset))) {
      problems.push('periode tidak berurutan')
    }
    if (problems.length > 0) {
      rowFailures += 1
      failures.push(`Angsuran ke-${instalment.index}: ${problems.join('; ')}`)
    }
    expectedOpening = instalment.closingBalance
  }
  if (rowFailures === 0) {
    checks.push(`Setiap baris konsisten dan saldo berantai: ${instalments.length} baris`)
  }

  return { checks, failures }
}

/** Throws rather than returning, so an unconserved schedule cannot escape. */
export function assertConservation(schedule: Schedule): ConservationReport {
  const report = checkConservation(schedule)
  if (report.failures.length > 0) {
    throw new ConservationError('Kekekalan jadwal angsuran dilanggar', report.failures)
  }
  return report
}

export function conservationStep(report: ConservationReport): TraceStep {
  return { type: 'conservation', label: 'Pemeriksaan kekekalan', checks: report.checks }
}
