'use server'

import { redirect } from 'next/navigation'
import { completeLogin, logoutOwner, requestLoginLink } from '@/lib/owner-session'

/** "Email me a login link". Always shows the same message, whether or not the email has access. */
export async function requestLogin(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '')
  try {
    await requestLoginLink(email)
  } catch (e) {
    console.error('requestLogin failed', e)
  }
  redirect('/owner?sent=1')
}

/** The "Log in" button on the page the emailed link opens. */
export async function verifyLogin(formData: FormData): Promise<void> {
  let ok = false
  try {
    ok = await completeLogin(String(formData.get('token') ?? ''))
  } catch (e) {
    console.error('verifyLogin failed', e)
  }
  redirect(ok ? '/owner/dashboard' : '/owner?expired=1')
}

export async function logout(): Promise<void> {
  try {
    await logoutOwner()
  } catch (e) {
    console.error('logout failed', e)
  }
  redirect('/owner?loggedout=1')
}
