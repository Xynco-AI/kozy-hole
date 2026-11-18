/**
 * Add-ons and pet fee: paid on arrival, never part of the online deposit.
 *
 * Bookings store the add-on LABEL (bookings.addons text[]), so labels must stay
 * stable. Set `price` once the owner confirms it; null shows "price confirmed on arrival".
 */

export const PET_FEE = 50

/** label: shown on the booking form and stored on bookings. name: used in price lists (no price repeated). */
export type Addon = { label: string; name?: string; price: number | null }

export const ADDONS: Addon[] = [
  { label: 'Bait & tackle pack', price: null },
  { label: 'Rod & gear rental', price: null },
  { label: 'Forward-facing sonar (Livescope) rental', price: null },
  {
    label: 'Shuttle to the cabin (+$60 round trip, conditions permitting)',
    name: 'Shuttle to the cabin (round trip, conditions permitting)',
    price: 60,
  },
  { label: 'Guided trip', price: null },
]

export type ArrivalItem = { label: string; price: number | null }

/** Everything the guest pays at the lake besides the balance: pet fee first, then add-ons in menu order. */
export function arrivalItems({ addons, hasPet }: { addons: string[] | null; hasPet: boolean }): ArrivalItem[] {
  const chosen = new Set(addons ?? [])
  const items: ArrivalItem[] = hasPet ? [{ label: 'Dog (pet fee)', price: PET_FEE }] : []
  for (const a of ADDONS) if (chosen.has(a.label)) items.push({ label: a.name ?? a.label, price: a.price })
  // Keep anything not on the current menu (e.g. older bookings) so it isn't silently dropped.
  for (const label of chosen) if (!ADDONS.some(a => a.label === label)) items.push({ label, price: null })
  return items
}

export function arrivalKnownTotal(items: ArrivalItem[]): number {
  return items.reduce((sum, i) => sum + (i.price ?? 0), 0)
}
