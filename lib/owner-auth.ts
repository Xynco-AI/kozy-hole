/**
 * Owner email login: pure rules (testable without a server). The cookie and database
 * side lives in lib/owner-session.ts.
 */
import { createHash } from 'crypto'

export const LOGIN_LINK_MINUTES = 15
export const SESSION_DAYS = 30
export const SESSION_COOKIE = 'kh_owner_session'
const MAX_LOGIN_EMAILS_PER_HOUR = 5

const normalize = (email: string) => email.trim().toLowerCase()

/**
 * Who may log in: OWNER_LOGIN_EMAILS (comma-separated), else the OWNER_EMAIL alert address.
 * Empty means nobody can log in.
 */
export function ownerAllowList(env: { OWNER_LOGIN_EMAILS?: string; OWNER_EMAIL?: string }): string[] {
  const raw = env.OWNER_LOGIN_EMAILS?.trim() ? env.OWNER_LOGIN_EMAILS : (env.OWNER_EMAIL ?? '')
  return raw.split(',').map(normalize).filter(Boolean)
}

export function isAllowedOwnerEmail(email: string, allowList: string[]): boolean {
  const e = normalize(email)
  return e !== '' && allowList.includes(e)
}

/** Only hashes of login-link and session tokens are stored in the database. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Caps login emails per address per hour, so the form can't be used to flood an inbox. */
export function tooManyLoginRequests(sentInLastHour: number): boolean {
  return sentInLastHour >= MAX_LOGIN_EMAILS_PER_HOUR
}
