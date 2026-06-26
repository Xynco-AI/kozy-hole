export type DateRange = { checkIn: Date; checkOut: Date }

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut
}

export function isCabinAvailable(requested: DateRange, existing: DateRange[]): boolean {
  return !existing.some(e => rangesOverlap(requested, e))
}
