export function familyDay(year: number): Date {
  const feb1 = new Date(year, 1, 1)
  const firstMonday = 1 + ((1 - feb1.getDay() + 7) % 7)
  return new Date(year, 1, firstMonday + 14) // 3rd Monday
}

export function albertaHolidays(year: number): Date[] {
  return [
    new Date(year, 11, 25), // Christmas Day
    new Date(year, 11, 26), // Boxing Day
    new Date(year, 0, 1),   // New Year's Day
    familyDay(year),
  ]
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function isHoliday(date: Date): boolean {
  return albertaHolidays(date.getFullYear()).some(h => sameDay(h, date))
}
