export function isWithinSeason(date: Date): boolean {
  const m = date.getMonth()
  const d = date.getDate()
  if (m === 11) return d >= 15  // Dec 15-31
  if (m === 0 || m === 1) return true // Jan, Feb
  if (m === 2) return d <= 31  // March
  return false
}

export function rangeWithinSeason(checkIn: Date, checkOut: Date): boolean {
  const lastNight = new Date(checkOut)
  lastNight.setDate(lastNight.getDate() - 1)
  return isWithinSeason(checkIn) && isWithinSeason(lastNight)
}
