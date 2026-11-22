import 'server-only'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'
import { generateToken } from './tokens'
import { sendOwnerLoginLink } from './email'
import {
  LOGIN_LINK_MINUTES, SESSION_COOKIE, SESSION_DAYS,
  hashToken, isAllowedOwnerEmail, ownerAllowList, tooManyLoginRequests,
} from './owner-auth'

const allowList = () =>
  ownerAllowList({ OWNER_LOGIN_EMAILS: process.env.OWNER_LOGIN_EMAILS, OWNER_EMAIL: process.env.OWNER_EMAIL })

/** The logged-in owner's email, or null. Removing an email from the allow-list logs it out. */
export async function getOwnerEmail(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const { data } = await supabaseAdmin()
    .from('owner_sessions')
    .select('email')
    .eq('token_hash', hashToken(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data && isAllowedOwnerEmail(data.email, allowList()) ? data.email : null
}

/**
 * Email a one-time login link if the address is on the allow-list. Says nothing either
 * way, so the form can't be used to discover which emails have access.
 */
export async function requestLoginLink(email: string): Promise<void> {
  if (!isAllowedOwnerEmail(email, allowList())) return
  const normalized = email.trim().toLowerCase()
  const db = supabaseAdmin()

  const { count } = await db.from('owner_login_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('email', normalized)
    .gt('created_at', new Date(Date.now() - 3600e3).toISOString())
  if (tooManyLoginRequests(count ?? 0)) return

  const token = generateToken()
  const { error } = await db.from('owner_login_tokens').insert({
    email: normalized,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + LOGIN_LINK_MINUTES * 60e3).toISOString(),
  })
  if (error) {
    console.error('owner login token insert failed', error)
    return
  }
  await sendOwnerLoginLink(normalized, `${process.env.NEXT_PUBLIC_SITE_URL}/owner/login/verify?token=${token}`)
}

/** Use a login link and set the session cookie on this device. Must run in a server action. */
export async function completeLogin(token: string): Promise<boolean> {
  if (!token) return false
  const sessionToken = generateToken()
  const { data: email, error } = await supabaseAdmin().rpc('owner_login', {
    p_token_hash: hashToken(token),
    p_session_hash: hashToken(sessionToken),
    p_session_days: SESSION_DAYS,
  })
  if (error || !email) return false
  ;(await cookies()).set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  })
  return true
}

/** End this device's session. Must run in a server action. */
export async function logoutOwner(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await supabaseAdmin().from('owner_sessions').delete().eq('token_hash', hashToken(token))
  store.delete(SESSION_COOKIE)
}
