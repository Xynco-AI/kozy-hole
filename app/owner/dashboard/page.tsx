import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getOwnerEmail } from '@/lib/owner-session'
import OwnerDashboard, { ownerPageMetadata } from '../_dashboard/OwnerDashboard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = ownerPageMetadata

export default async function LoggedInDashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>
}) {
  const ownerEmail = await getOwnerEmail()
  if (!ownerEmail) redirect('/owner')
  return <OwnerDashboard secret="" ownerEmail={ownerEmail} noticeCode={(await searchParams).notice} />
}
