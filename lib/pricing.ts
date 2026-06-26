import { isHoliday } from './holidays'
import { rangeWithinSeason } from './season'

const WEEKDAY_RATE = 350
const WEEKEND_RATE = 450
const GST_RATE = 0.05
const CARD_SURCHARGE = 0.03
const DEPOSIT_FRACTION = 0.5

const round2 = (n: number) => Math.round(n * 100) / 100

export function nightlyRate(date: Date): number {
  const day = date.getDay() // 5 = Fri, 6 = Sat
  if (day === 5 || day === 6 || isHoliday(date)) return WEEKEND_RATE
  return WEEKDAY_RATE
}

export function nightsBetween(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = []
  const d = new Date(checkIn)
  while (d < checkOut) {
    nights.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return nights
}

export type Quote = {
  nights: number
  nightlySubtotal: number
  gst: number
  total: number
  deposit: number
  cardCharge: number
  etransferCharge: number
  balanceOnArrival: number
}

export function quote(checkIn: Date, checkOut: Date, cabinCount: number): Quote {
  const nights = nightsBetween(checkIn, checkOut)
  const perCabin = nights.reduce((sum, n) => sum + nightlyRate(n), 0)
  const nightlySubtotal = perCabin * cabinCount
  const gst = round2(nightlySubtotal * GST_RATE)
  const total = round2(nightlySubtotal + gst)
  const deposit = round2(total * DEPOSIT_FRACTION)
  return {
    nights: nights.length,
    nightlySubtotal,
    gst,
    total,
    deposit,
    cardCharge: round2(deposit * (1 + CARD_SURCHARGE)),
    etransferCharge: deposit,
    balanceOnArrival: round2(total - deposit),
  }
}

export type StayError = 'MIN_ONE_NIGHT' | 'OUT_OF_SEASON' | 'WEEKEND_TWO_NIGHT_MIN'

export function validateStay(checkIn: Date, checkOut: Date): StayError | null {
  const nights = nightsBetween(checkIn, checkOut)
  if (nights.length < 1) return 'MIN_ONE_NIGHT'
  if (!rangeWithinSeason(checkIn, checkOut)) return 'OUT_OF_SEASON'
  const hasWeekendNight = nights.some(n => n.getDay() === 5 || n.getDay() === 6)
  if (hasWeekendNight && nights.length < 2) return 'WEEKEND_TWO_NIGHT_MIN'
  return null
}
