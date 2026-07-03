/**
 * IMOAUTO service commission on daily-rental bookings.
 * Paid by the HOST: the guest pays the listed price; the host receives the
 * total minus the commission (see Termos §4). Stored per-booking at creation
 * time so a future rate change never rewrites old bookings.
 */
export const COMMISSION_RATE = 0.1

export function commissionCve(totalCve: number, rate: number = COMMISSION_RATE): number {
  return Math.round(totalCve * rate)
}

/** What the host receives after the IMOAUTO commission. */
export function hostPayoutCve(totalCve: number, rate: number = COMMISSION_RATE): number {
  return totalCve - commissionCve(totalCve, rate)
}
