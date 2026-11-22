import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { safeEqual } from '@/lib/tokens'
import OwnerDashboard, { ownerPageMetadata } from '../_dashboard/OwnerDashboard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = ownerPageMetadata

// The original secret-link dashboard. Kept working while the owner moves to the email
// login at /owner; retire it by changing or removing OWNER_DASHBOARD_SECRET.
export default async function SecretLinkDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ secret: string }>
  searchParams: Promise<{ notice?: string }>
}) {
  const { secret } = await params
  if (!process.env.OWNER_DASHBOARD_SECRET || !safeEqual(secret, process.env.OWNER_DASHBOARD_SECRET)) {
    notFound()
  }
  return <OwnerDashboard secret={secret} noticeCode={(await searchParams).notice} />
}
