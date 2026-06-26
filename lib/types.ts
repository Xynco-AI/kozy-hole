export type BookingStatus =
  'REQUESTED' | 'APPROVED' | 'CONFIRMED' | 'DECLINED' | 'EXPIRED' | 'COMPLETED'

export type Cabin = {
  id: string
  slug: string
  name: string
  theme: string | null
  sleeps: number
  max_with_cot: number
  description: string | null
  features: string[]
  photos: string[]
}
