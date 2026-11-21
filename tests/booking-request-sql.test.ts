/**
 * Runs the real migrations in an in-process Postgres (PGlite) and exercises
 * create_booking_request(). PGlite is single-connection, so this covers the
 * overlap/atomicity logic; the cross-request race is handled by the per-cabin
 * advisory locks in the function, which need a real multi-connection server to test.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

const MIGRATIONS = path.join(__dirname, '..', 'supabase', 'migrations')

let db: PGlite
let cabinA: string
let cabinB: string

beforeEach(async () => {
  db = new PGlite()
  // Supabase roles referenced by the migrations
  await db.exec(`create role anon; create role authenticated; create role service_role;`)
  for (const f of readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(path.join(MIGRATIONS, f), 'utf8'))
  }
  const { rows } = await db.query<{ id: string }>(
    `insert into cabins (slug, name, sort_order) values ('a','A',1), ('b','B',2) returning id`)
  ;[cabinA, cabinB] = rows.map(r => r.id)
})

type RpcResult = { ok: boolean; booking_id?: string; error?: string; cabin_id?: string }

async function request(checkIn: string, checkOut: string, cabinIds: string[]): Promise<RpcResult> {
  const { rows } = await db.query<{ r: RpcResult }>(
    `select create_booking_request(
       p_guest_name => 'Test Guest', p_email => 'g@example.com', p_phone => '7805550000',
       p_party_size => 4, p_has_pet => false,
       p_check_in => $1::date, p_check_out => $2::date, p_nights => 2,
       p_nightly_subtotal => 800, p_gst => 40, p_total => 840,
       p_deposit_amount => 420, p_card_charge => 432.6,
       p_approval_token => 'tok', p_addons => '{}'::text[],
       p_cabin_ids => $3::uuid[], p_party_members => array['Friend One']
     ) as r`,
    [checkIn, checkOut, cabinIds])
  return rows[0].r
}

async function count(table: string): Promise<number> {
  const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from ${table}`)
  return rows[0].n
}

describe('create_booking_request', () => {
  it('creates the booking, its cabins and the waiver together', async () => {
    const r = await request('2027-01-15', '2027-01-17', [cabinA, cabinB])
    expect(r.ok).toBe(true)
    const { rows } = await db.query<{ status: string; card_charge: string }>(
      `select status, card_charge from bookings where id = $1`, [r.booking_id])
    expect(rows[0]).toEqual({ status: 'REQUESTED', card_charge: '432.60' })
    expect(await count('booking_cabins')).toBe(2)
    expect(await count('waivers')).toBe(1)
  })

  it('rejects a request overlapping an active booking on the same cabin', async () => {
    await request('2027-01-15', '2027-01-17', [cabinA])
    const r = await request('2027-01-16', '2027-01-18', [cabinA])
    expect(r).toEqual({ ok: false, error: 'CABIN_UNAVAILABLE', cabin_id: cabinA })
    expect(await count('bookings')).toBe(1)
  })

  it('allows back-to-back stays (check-out day = next check-in day)', async () => {
    await request('2027-01-15', '2027-01-17', [cabinA])
    expect((await request('2027-01-17', '2027-01-19', [cabinA])).ok).toBe(true)
  })

  it('allows the same dates on a different cabin', async () => {
    await request('2027-01-15', '2027-01-17', [cabinA])
    expect((await request('2027-01-15', '2027-01-17', [cabinB])).ok).toBe(true)
  })

  it('ignores declined, expired and cancelled bookings', async () => {
    for (const status of ['DECLINED', 'EXPIRED', 'CANCELLED']) {
      const first = await request('2027-01-15', '2027-01-17', [cabinA])
      await db.query(`update bookings set status = $1 where id = $2`, [status, first.booking_id])
    }
    expect((await request('2027-01-15', '2027-01-17', [cabinA])).ok).toBe(true)
  })

  it('treats approved and confirmed bookings as holding the cabin', async () => {
    for (const status of ['APPROVED', 'CONFIRMED']) {
      const db2 = await request('2027-02-01', '2027-02-03', [cabinA])
      await db.query(`update bookings set status = $1 where id = $2`, [status, db2.booking_id])
      expect((await request('2027-02-02', '2027-02-04', [cabinA])).ok).toBe(false)
      await db.query(`update bookings set status = 'CANCELLED' where id = $1`, [db2.booking_id])
    }
  })

  it('rejects dates the owner has blocked', async () => {
    await db.query(`insert into blocked_dates (cabin_id, start_date, end_date) values ($1, '2027-01-10', '2027-01-20')`, [cabinA])
    expect(await request('2027-01-15', '2027-01-17', [cabinA]))
      .toEqual({ ok: false, error: 'CABIN_UNAVAILABLE', cabin_id: cabinA })
  })

  describe('owner blocks include the end date (block Jan 10-20 = first check-in Jan 21)', () => {
    beforeEach(async () => {
      await db.query(`insert into blocked_dates (cabin_id, start_date, end_date) values ($1, '2027-01-10', '2027-01-20')`, [cabinA])
    })

    it('rejects a stay starting on the last blocked day', async () => {
      expect((await request('2027-01-20', '2027-01-22', [cabinA])).ok).toBe(false)
    })

    it('allows a stay starting the day after the block ends', async () => {
      expect((await request('2027-01-21', '2027-01-23', [cabinA])).ok).toBe(true)
    })

    it('allows a stay that checks out on the first blocked day', async () => {
      expect((await request('2027-01-08', '2027-01-10', [cabinA])).ok).toBe(true)
    })

    it('rejects a one-day block on that day', async () => {
      await db.query(`insert into blocked_dates (cabin_id, start_date, end_date) values ($1, '2027-02-05', '2027-02-05')`, [cabinA])
      expect((await request('2027-02-05', '2027-02-06', [cabinA])).ok).toBe(false)
    })
  })

  it('inserts nothing when any one of several cabins is taken', async () => {
    await request('2027-01-15', '2027-01-17', [cabinB])
    const r = await request('2027-01-15', '2027-01-17', [cabinA, cabinB])
    expect(r).toEqual({ ok: false, error: 'CABIN_UNAVAILABLE', cabin_id: cabinB })
    expect(await count('bookings')).toBe(1)
    expect(await count('booking_cabins')).toBe(1)
    expect(await count('waivers')).toBe(1)
  })

  describe('update_booking_cabins (owner changes cabins on a pending request)', () => {
    let cabinC: string
    beforeEach(async () => {
      const { rows } = await db.query<{ id: string }>(
        `insert into cabins (slug, name, sort_order) values ('c','C',3) returning id`)
      cabinC = rows[0].id
    })

    async function change(bookingId: string, cabinIds: string[], subtotal = 400): Promise<RpcResult> {
      const { rows } = await db.query<{ r: RpcResult }>(
        `select update_booking_cabins(
           p_booking_id => $1::uuid, p_cabin_ids => $2::uuid[],
           p_nightly_subtotal => $3, p_gst => $3 * 0.05, p_total => $3 * 1.05,
           p_deposit_amount => $3 * 0.525, p_card_charge => $3 * 0.54075
         ) as r`, [bookingId, cabinIds, subtotal])
      return rows[0].r
    }

    async function cabinsOf(id: string): Promise<string[]> {
      const { rows } = await db.query<{ cabin_id: string }>(
        `select cabin_id from booking_cabins where booking_id = $1 order by cabin_id`, [id])
      return rows.map(r => r.cabin_id)
    }

    it('swaps the cabins and stores the new price', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA, cabinB, cabinC])
      expect(await change(b.booking_id!, [cabinB], 900)).toEqual({ ok: true })
      expect(await cabinsOf(b.booking_id!)).toEqual([cabinB])
      const { rows } = await db.query<{ total: string; nightly_subtotal: string }>(
        `select total, nightly_subtotal from bookings where id = $1`, [b.booking_id])
      expect(rows[0]).toEqual({ total: '945.00', nightly_subtotal: '900.00' })
    })

    it('does not count the booking against itself (keeping one of its own cabins)', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA, cabinB])
      expect((await change(b.booking_id!, [cabinA])).ok).toBe(true)
    })

    it('refuses a cabin another active booking holds, and changes nothing', async () => {
      await request('2027-01-15', '2027-01-17', [cabinC])
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect(await change(b.booking_id!, [cabinC]))
        .toEqual({ ok: false, error: 'CABIN_UNAVAILABLE', cabin_id: cabinC })
      expect(await cabinsOf(b.booking_id!)).toEqual([cabinA])
    })

    it('refuses a cabin with owner-blocked dates', async () => {
      await db.query(`insert into blocked_dates (cabin_id, start_date, end_date) values ($1, '2027-01-16', '2027-01-16')`, [cabinC])
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect((await change(b.booking_id!, [cabinC])).ok).toBe(false)
    })

    it('only works on requests that have not been approved yet', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA, cabinB])
      await db.query(`update bookings set status = 'APPROVED' where id = $1`, [b.booking_id])
      expect(await change(b.booking_id!, [cabinA])).toEqual({ ok: false, error: 'NOT_PENDING' })
      expect(await cabinsOf(b.booking_id!)).toHaveLength(2)
    })

    it('rejects an empty cabin list', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect(await change(b.booking_id!, [])).toEqual({ ok: false, error: 'NO_CABINS' })
    })

    it('cannot be called with the public anon key', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      await db.exec(`set role anon`)
      await expect(change(b.booking_id!, [cabinB])).rejects.toThrow(/permission denied/)
    })
  })

  describe('update_booking (owner changes dates and/or cabins on an unpaid booking)', () => {
    type EditResult = RpcResult & { previous_status?: string; old_session_id?: string | null }

    async function edit(id: string, checkIn: string, checkOut: string, cabinIds: string[], subtotal = 700): Promise<EditResult> {
      const { rows } = await db.query<{ r: EditResult }>(
        `select update_booking(
           p_booking_id => $1::uuid, p_check_in => $2::date, p_check_out => $3::date, p_nights => 2,
           p_cabin_ids => $4::uuid[], p_nightly_subtotal => $5, p_gst => $5 * 0.05, p_total => $5 * 1.05,
           p_deposit_amount => $5 * 0.525, p_card_charge => $5 * 0.54075
         ) as r`, [id, checkIn, checkOut, cabinIds, subtotal])
      return rows[0].r
    }
    const row = async (id: string) => (await db.query<Record<string, string | null>>(
      `select status, check_in::text, check_out::text, total, stripe_session_id, approved_at, payment_reminder_sent_at
         from bookings where id = $1`, [id])).rows[0]

    it('moves a pending request to new dates and re-prices it', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect(await edit(b.booking_id!, '2027-02-01', '2027-02-03', [cabinA], 700))
        .toEqual({ ok: true, previous_status: 'REQUESTED', old_session_id: null })
      expect(await row(b.booking_id!)).toMatchObject({ check_in: '2027-02-01', check_out: '2027-02-03', total: '735.00' })
    })

    it('can shift dates onto overlapping days the booking itself already holds', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect((await edit(b.booking_id!, '2027-01-16', '2027-01-18', [cabinA])).ok).toBe(true)
    })

    it('refuses new dates that clash with another booking, and changes nothing', async () => {
      await request('2027-02-01', '2027-02-03', [cabinA])
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect(await edit(b.booking_id!, '2027-02-02', '2027-02-04', [cabinA]))
        .toEqual({ ok: false, error: 'CABIN_UNAVAILABLE', cabin_id: cabinA })
      expect(await row(b.booking_id!)).toMatchObject({ check_in: '2027-01-15', check_out: '2027-01-17' })
    })

    it('refuses new dates inside an owner block', async () => {
      await db.query(`insert into blocked_dates (cabin_id, start_date, end_date) values ($1, '2027-02-02', '2027-02-02')`, [cabinA])
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect((await edit(b.booking_id!, '2027-02-01', '2027-02-03', [cabinA])).ok).toBe(false)
    })

    it('on an approved booking: drops the old payment link and restarts the hold', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      await db.query(
        `update bookings set status = 'APPROVED', approved_at = now() - interval '40 hours',
                stripe_session_id = 'cs_old', payment_reminder_sent_at = now() where id = $1`, [b.booking_id])
      expect(await edit(b.booking_id!, '2027-02-01', '2027-02-03', [cabinB]))
        .toEqual({ ok: true, previous_status: 'APPROVED', old_session_id: 'cs_old' })
      const r = await row(b.booking_id!)
      expect(r).toMatchObject({ status: 'APPROVED', stripe_session_id: null, payment_reminder_sent_at: null })
      expect(Date.now() - new Date(r.approved_at!).getTime()).toBeLessThan(60_000)
    })

    it('will not touch a paid booking', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      await db.query(`update bookings set status = 'CONFIRMED' where id = $1`, [b.booking_id])
      expect(await edit(b.booking_id!, '2027-02-01', '2027-02-03', [cabinA])).toEqual({ ok: false, error: 'NOT_EDITABLE' })
    })

    it('rejects check-out on or before check-in', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      expect(await edit(b.booking_id!, '2027-02-03', '2027-02-03', [cabinA])).toEqual({ ok: false, error: 'INVALID_DATES' })
    })

    it('cannot be called with the public anon key', async () => {
      const b = await request('2027-01-15', '2027-01-17', [cabinA])
      await db.exec(`set role anon`)
      await expect(edit(b.booking_id!, '2027-02-01', '2027-02-03', [cabinA])).rejects.toThrow(/permission denied/)
    })
  })

  describe('create_phone_booking (owner books a guest over the phone)', () => {
    async function phone(checkIn: string, checkOut: string, cabinIds: string[]): Promise<RpcResult> {
      const { rows } = await db.query<{ r: RpcResult }>(
        `select create_phone_booking(
           p_guest_name => 'Phone Guest', p_email => 'p@example.com', p_phone => '7805551111',
           p_party_size => 2, p_has_pet => false,
           p_check_in => $1::date, p_check_out => $2::date, p_nights => 2,
           p_nightly_subtotal => 700, p_gst => 35, p_total => 735,
           p_deposit_amount => 367.5, p_card_charge => 378.53,
           p_approval_token => 'tok', p_addons => '{}'::text[], p_cabin_ids => $3::uuid[]
         ) as r`, [checkIn, checkOut, cabinIds])
      return rows[0].r
    }

    it('creates the booking already approved, marked as a phone booking, with the hold starting now', async () => {
      const r = await phone('2027-01-15', '2027-01-17', [cabinA])
      expect(r.ok).toBe(true)
      const { rows } = await db.query<{ status: string; source: string; held_for: number }>(
        `select status, source, extract(epoch from now() - approved_at)::int as held_for from bookings where id = $1`,
        [r.booking_id])
      expect(rows[0]).toEqual({ status: 'APPROVED', source: 'phone', held_for: 0 })
      expect(await count('booking_cabins')).toBe(1)
    })

    it('does NOT create a waiver: the guest must sign it themselves', async () => {
      await phone('2027-01-15', '2027-01-17', [cabinA])
      expect(await count('waivers')).toBe(0)
    })

    it('respects the same availability rules as online bookings', async () => {
      await request('2027-01-15', '2027-01-17', [cabinA])
      expect(await phone('2027-01-16', '2027-01-18', [cabinA]))
        .toEqual({ ok: false, error: 'CABIN_UNAVAILABLE', cabin_id: cabinA })
      expect(await count('bookings')).toBe(1)
    })

    it('blocks later online requests for the same cabin and dates', async () => {
      await phone('2027-01-15', '2027-01-17', [cabinA])
      expect((await request('2027-01-15', '2027-01-17', [cabinA])).ok).toBe(false)
    })

    it('marks online bookings as online', async () => {
      const r = await request('2027-01-15', '2027-01-17', [cabinA])
      const { rows } = await db.query<{ source: string }>(`select source from bookings where id = $1`, [r.booking_id])
      expect(rows[0].source).toBe('online')
    })

    it('cannot be called with the public anon key', async () => {
      await db.exec(`set role anon`)
      await expect(phone('2027-01-15', '2027-01-17', [cabinA])).rejects.toThrow(/permission denied/)
    })
  })

  it('adds a payment_reminder_sent_at column for the unpaid-deposit reminder', async () => {
    const { rows } = await db.query(
      `select 1 from information_schema.columns where table_name = 'bookings' and column_name = 'payment_reminder_sent_at'`)
    expect(rows).toHaveLength(1)
  })

  it('cannot be called with the public anon key', async () => {
    await db.exec(`set role anon`)
    await expect(request('2027-01-15', '2027-01-17', [cabinA])).rejects.toThrow(/permission denied/)
  })
})
