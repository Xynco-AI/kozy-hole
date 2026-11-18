# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Next.js 16 warning (from AGENTS.md):** this Next.js version has breaking changes compared with your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. For example, route `params` are a `Promise` and must be awaited.

## Project

This is the booking site for Kozy Hole Ice Shack Rentals. The business rents 3 ice-fishing cabins on Lac la Biche Lake, Alberta, and the site is live at kozyhole.ca on Vercel. The stack is Next.js 16 (App Router, TypeScript), Tailwind v4, Supabase (Postgres), Stripe, Resend, Zod and Vitest.

The design spec and implementation plan are in `../docs/superpowers/` (outside this repo). Go-live steps and the full list of env vars are in `DEPLOY.md`.

## Commands

```bash
npm run dev                          # http://localhost:3000
npm run build
npm run lint                         # eslint (flat config)
npm test                             # vitest run (tests/**/*.test.ts, node env)
npx vitest run tests/pricing.test.ts # single file
npx vitest run -t "weekend"          # tests matching a name
```

Windows ARM64: if vitest/rolldown native bindings fail to load, delete `node_modules` and `package-lock.json` and run `npm install` again. This works around an npm optional-dependency bug.

Path alias `@/` maps to the project root, in both tsconfig and vitest.

## Architecture

**Pure business logic lives in `lib/` and is unit-tested.** `pricing.ts` covers rates, GST, card surcharge, deposit and `validateStay`. `season.ts` is the Dec 15 to Mar 31 window. `holidays.ts` holds the Alberta holidays that get the weekend rate. `deposit-payment.ts` holds the card-deposit pay-link and webhook logic, with I/O passed in as deps. These modules have no I/O. Change pricing or rules here, not in components, because the quote shown in the UI and the amounts stored in the DB both come from `quote()`.

**Dates:** booking dates are `'YYYY-MM-DD'` strings. Always parse them with `parseLocalDate()` from `lib/dates.ts`, never with `new Date(str)`. UTC parsing shifts the calendar day and breaks weekday and weekend pricing.

**Supabase access:** RLS is enabled on every table (migration `0002`). The anon key can read only `cabins` and approved `reviews`. All booking reads and writes go through `supabaseAdmin()` (service role) in `lib/supabase.ts`, which is `server-only`. Never use it from client components. Schema changes are new numbered files in `supabase/migrations/`, run by hand in the Supabase SQL editor.

**Booking state machine** (`bookings.status`): `REQUESTED → APPROVED → CONFIRMED → COMPLETED`, plus `DECLINED`, `EXPIRED` and `CANCELLED`. A booking holds its cabins while it is REQUESTED, APPROVED or CONFIRMED. Status updates are guarded with `.eq('status', <expected>)` so that repeated or concurrent calls are idempotent. Keep that pattern.

How a booking moves through the system:
1. `app/book/actions.ts` (`createBookingRequest`, a server action) validates input with Zod and prices the stay with `quote()`. It then calls the Postgres function `create_booking_request` (migration `0005`). That function locks each cabin, checks for overlaps with active bookings and `blocked_dates`, and inserts `bookings`, `booking_cabins` and `waivers` in one transaction. The action then emails the owner. Overlap rules live only in that SQL function, and `tests/booking-request-sql.test.ts` runs every migration in PGlite (an in-process Postgres) to test it.
2. The owner approves in one of two ways. The emailed link `GET /api/bookings/[id]/approve?token=…` is checked against `approval_token`. The dashboard at `/owner/[secret]` is checked against `OWNER_DASHBOARD_SECRET`. Both call `approveBooking()` in `lib/booking-approval.ts`. That function updates the DB first, then creates the Stripe Checkout session for the 50% deposit, then emails the guest.
3. `POST /api/stripe/webhook` handles `checkout.session.completed`. When `metadata.type === 'damage_deposit'`, it records the $500/cabin pre-auth hold. Otherwise it flips APPROVED to CONFIRMED and sends the confirmation email.
4. Vercel crons (`vercel.json`) run once a day and require `Authorization: Bearer $CRON_SECRET` (they reject the request if it is not set).
   - `/api/cron/expire-holds` applies the rules in `lib/daily-jobs.ts`. It expires APPROVED bookings 48h after approval and emails the guest. It sends one "pay your deposit" reminder at 24h. It emails the owner a list of REQUESTED bookings older than 24h. It never auto-declines a future request, and only expires REQUESTED bookings whose check-in has already passed.
   - `/api/cron/send-deposit-reminders` sends the damage-deposit request 3 days before check-in.
   - Card checkout sessions are created with `expires_at` capped at the end of the 48h hold, so a card can't be charged after the hold lapses.

**Owner can change cabins** on a REQUESTED booking from the dashboard. This calls the Postgres function `update_booking_cabins` (migration `0007`), which re-checks availability and stores the re-priced amounts.

**Email content** lives in `lib/email-templates.ts` as pure, tested functions. `lib/email.ts` only loads the booking and sends. Add-on menu and prices are in `lib/addons.ts`; the stored label must stay stable because bookings store it.

**Auth:** there are no user accounts. Access is controlled by secrets in URLs: a per-booking `approval_token` and the dashboard secret. Compare them with `safeEqual()` from `lib/tokens.ts`, which is timing-safe.

**Email:** all templates live in `lib/email.ts` (Resend, sent from the kozyhole.ca domain). Do not use em dashes in email copy. They were deliberately removed.

**Landing page:** `app/page.tsx` composes the components in `components/sections/*`. Marketing copy comes from `lib/content.ts`, which is the single source of truth and needs no database. Cabin names ("Cabin One/Two/Three") are placeholders until the owner picks real ones. When they change, update both `lib/content.ts` and the Supabase `cabins` table. Brand images are in `public/brand/`. The originals are in `../images/`.

## Pending / phase 2
- Stripe live keys and `STRIPE_WEBHOOK_SECRET` are still waiting on the owner. Production currently uses Stripe test keys.
- Not built yet: handling for Stripe session-expired and payment-failed events, and WhatsApp owner alerts.
