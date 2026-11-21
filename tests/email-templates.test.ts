import { describe, it, expect } from 'vitest'
import * as t from '@/lib/email-templates'
import { ADDONS } from '@/lib/addons'

const SHUTTLE = ADDONS.find(a => a.price === 60)!.label

const booking: t.EmailBooking = {
  id: 'b1',
  guest_name: 'Test Guest',
  email: 'guest@example.com',
  phone: '7805550000',
  party_size: 3,
  has_pet: true,
  check_in: '2027-03-16',
  check_out: '2027-03-18',
  nights: 2,
  nightly_subtotal: 700,
  gst: 35,
  total: 735,
  deposit_amount: 367.5,
  card_charge: 378.53,
  addons: [SHUTTLE, 'Guided trip'],
  cabins: ['Cabin One'],
}

const all = (): t.Email[] => [
  t.ownerRequestAlert(booking, { approveUrl: 'https://x/a', declineUrl: 'https://x/d' }),
  t.guestRequestReceived(booking, { statusUrl: 'https://x/s' }),
  t.guestApproved(booking, { payUrl: 'https://x/p', etransferEmail: 'pay@example.com' }),
  t.guestConfirmed(booking),
  t.ownerConfirmed(booking),
  t.damageDepositRequest(booking, { depositUrl: 'https://x/dd' }),
  t.cancellation(booking),
  t.ownerPendingReminder([booking], { dashboardUrl: 'https://x/owner' }),
  t.guestPaymentReminder(booking, { payUrl: 'https://x/p', etransferEmail: 'pay@example.com', holdEndsAt: new Date('2027-01-11T20:00:00Z') }),
  t.guestHoldExpired(booking, { bookUrl: 'https://x/book' }),
  t.guestBookingUpdated(booking, { payUrl: 'https://x/p', etransferEmail: 'pay@example.com', holdEndsAt: new Date('2027-01-11T20:00:00Z') }),
  t.guestConfirmationMistake(booking, { payUrl: 'https://x/p', etransferEmail: 'pay@example.com', holdEndsAt: new Date('2027-01-11T20:00:00Z') }),
]

describe('guestBookingUpdated', () => {
  const e = t.guestBookingUpdated(booking, {
    payUrl: 'https://x/p', etransferEmail: 'pay@example.com', holdEndsAt: new Date('2027-01-11T20:00:00Z'),
  })

  it('says the booking was changed and shows the new stay and price', () => {
    expect(e.subject.toLowerCase()).toContain('updated')
    expect(e.html).toContain('Tue, Mar 16, 2027')
    expect(e.html).toContain('Cabin One')
    expect(e.html).toContain('$735.00')
  })

  it('warns that older payment links no longer work, and gives the new one', () => {
    expect(e.html).toMatch(/earlier payment link/i)
    expect(e.html).toContain('href="https://x/p"')
    expect(e.html).toContain('pay@example.com')
  })

  it('says when the new hold ends', () => {
    expect(e.html).toMatch(/Mon, Jan 11.*1:00\s?p\.?m\.?/i)
  })
})

describe('ownerPendingReminder', () => {
  const two = [booking, { ...booking, id: 'b2', guest_name: 'Second Guest', cabins: ['Cabin Two'] }]

  it('counts and lists every waiting request', () => {
    const e = t.ownerPendingReminder(two, { dashboardUrl: 'https://x/owner' })
    expect(e.subject).toContain('2 booking requests')
    expect(e.html).toContain('Test Guest')
    expect(e.html).toContain('Second Guest')
    expect(e.html).toContain('href="https://x/owner"')
  })

  it('uses the singular for one request', () => {
    expect(t.ownerPendingReminder([booking], { dashboardUrl: 'd' }).subject).toContain('1 booking request ')
  })
})

describe('guestPaymentReminder', () => {
  const e = t.guestPaymentReminder(booking, {
    payUrl: 'https://x/p', etransferEmail: 'pay@example.com', holdEndsAt: new Date('2027-01-11T20:00:00Z'),
  })

  it('says when the hold ends, in Alberta time', () => {
    expect(e.html).toMatch(/Mon, Jan 11.*1:00\s?p\.?m\.?/i)
  })

  it('gives both ways to pay', () => {
    expect(e.html).toContain('href="https://x/p"')
    expect(e.html).toContain('pay@example.com')
    expect(e.html).toContain('$367.50')
  })
})

describe('guestHoldExpired', () => {
  it('explains the dates were released and how to rebook', () => {
    const e = t.guestHoldExpired(booking, { bookUrl: 'https://x/book' })
    expect(e.html).toMatch(/released/i)
    expect(e.html).toContain('href="https://x/book"')
  })
})

describe('all emails', () => {
  it('show money with cents and never as "$367.5"', () => {
    for (const e of all()) expect(e.html).not.toMatch(/\$\d+\.\d(?!\d)/)
  })

  it('show readable dates, not raw YYYY-MM-DD', () => {
    for (const e of all()) {
      expect(e.subject + e.html).not.toMatch(/2027-03-1\d/)
    }
    expect(t.guestConfirmed(booking).html).toContain('Tue, Mar 16, 2027')
  })

  it('contain no em dashes (house style for emails)', () => {
    for (const e of all()) expect(e.subject + e.html).not.toContain('—')
  })

  it('escape what the guest typed', () => {
    const evil = { ...booking, guest_name: '<img src=x onerror=alert(1)>' }
    const html = t.ownerRequestAlert(evil, { approveUrl: 'a', declineUrl: 'd' }).html
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img')
  })
})

describe('price breakdown with several cabins', () => {
  // Real case: a 2-night, 3-cabin request read as "2 nights $2,700" and looked like a 3x overcharge.
  const three = { ...booking, cabins: ['Cabin One', 'Cabin Two', 'Cabin Three'], nightly_subtotal: 2700 }

  it('shows nights x cabins so the subtotal makes sense', () => {
    for (const e of [
      t.ownerRequestAlert(three, { approveUrl: 'a', declineUrl: 'd' }),
      t.guestRequestReceived(three, { statusUrl: 's' }),
    ]) expect(e.html).toContain('2 nights × 3 cabins')
  })

  it('puts the cabin count in the owner alert subject', () => {
    expect(t.ownerRequestAlert(three, { approveUrl: 'a', declineUrl: 'd' }).subject).toContain('3 cabins')
  })

  it('keeps the simple label for one cabin', () => {
    expect(t.guestRequestReceived(booking, { statusUrl: 's' }).html).not.toContain('× 1 cabin')
  })
})

describe('ownerRequestAlert', () => {
  it('tells the owner the cabin, pet and add-ons to prepare', () => {
    const { html } = t.ownerRequestAlert(booking, { approveUrl: 'a', declineUrl: 'd' })
    expect(html).toContain('Cabin One')
    expect(html).toContain('Dog (pet fee)')
    expect(html).toContain('Shuttle to the cabin')
    expect(html).toContain('Guided trip')
  })

  it('says "None" when no add-ons were chosen', () => {
    const { html } = t.ownerRequestAlert({ ...booking, addons: [], has_pet: false }, { approveUrl: 'a', declineUrl: 'd' })
    expect(html).toMatch(/Add-ons[\s\S]*None/)
  })
})

describe('guestRequestReceived', () => {
  const e = t.guestRequestReceived(booking, { statusUrl: 'https://x/s' })

  it('makes clear it is not confirmed and nothing is charged yet', () => {
    expect(e.subject.toLowerCase()).toContain('request')
    expect(e.html).toMatch(/not confirmed yet/i)
    expect(e.html).toMatch(/no payment/i)
  })

  it('includes the full price breakdown', () => {
    for (const s of ['$700.00', '$35.00', '$735.00', '$367.50', '$378.53']) expect(e.html).toContain(s)
  })

  it('lists what is paid on arrival, with prices where known', () => {
    expect(e.html).toContain('Dog (pet fee)')
    expect(e.html).toContain('$50.00')
    expect(e.html).toContain('$60.00')
    expect(e.html).toMatch(/Guided trip[\s\S]*price confirmed on arrival/i)
  })

  it('links to the booking status page', () => {
    expect(e.html).toContain('href="https://x/s"')
  })
})

describe('guestConfirmationMistake', () => {
  const e = t.guestConfirmationMistake(booking, {
    payUrl: 'https://x/p', etransferEmail: 'pay@example.com', holdEndsAt: new Date('2027-01-11T20:00:00Z'),
  })

  it('apologises and says the deposit has not been received', () => {
    expect(e.html).toMatch(/by mistake/i)
    expect(e.html).toMatch(/not (been )?received/i)
  })

  it('gives the way to pay and the hold deadline', () => {
    expect(e.html).toContain('href="https://x/p"')
    expect(e.html).toContain('$367.50')
    expect(e.html).toMatch(/Mon, Jan 11/)
  })
})

describe('guestApproved', () => {
  it('shows the full stay and price, so a changed request makes sense', () => {
    const { html } = t.guestApproved({ ...booking, cabins: ['Cabin Two'] }, { payUrl: 'p', etransferEmail: 'x@y.z' })
    expect(html).toContain('Cabin Two')
    expect(html).toContain('$735.00')
    expect(html).toContain('Tue, Mar 16, 2027')
  })

  it('uses the e-transfer address it is given', () => {
    const { html } = t.guestApproved(booking, { payUrl: 'https://x/p', etransferEmail: 'pay@example.com' })
    expect(html).toContain('pay@example.com')
    expect(html).toContain('href="https://x/p"')
  })
})
