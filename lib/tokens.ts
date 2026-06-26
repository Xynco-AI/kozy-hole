import { randomBytes, timingSafeEqual } from 'crypto'

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}
