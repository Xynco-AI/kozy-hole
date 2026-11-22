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

**Running locally touches production.** `.env.local` points at the live Supabase database and the real Resend key, and `OWNER_EMAIL` is the owner's real inbox. Anything you book, approve or cancel on `localhost` changes real data and can email Rob or guests. To test safely, override `OWNER_EMAIL` (and `NEXT_PUBLIC_SITE_URL`) in the shell before `next dev`, use far-future dates and your own email as the guest, and delete test bookings afterwards. `STRIPE_SECRET_KEY` in `.env.local` is a placeholder, so card payment fails locally (the pay page shows "Card payment isn't available"); a full Stripe test needs a real `sk_test_` key and `stripe listen --forward-to localhost:<port>/api/stripe/webhook`. Load extra env vars with `set -a; . <(tr -d '\r' < file)`; `node --env-file` breaks `next dev`.

The project lives in OneDrive, which can lock files in `.next`; if a build fails once with odd errors, rebuild before debugging. If `next dev` keeps serving old styles or code after edits (check the served CSS, not just the source), stop it, delete `.next/dev`, and restart.

## Architecture

**Pure business logic lives in `lib/` and is unit-tested.** `pricing.ts` covers rates, GST, card surcharge, deposit and `validateStay`. `season.ts` is the Dec 15 to Mar 31 window. `holidays.ts` holds the Alberta holidays that get the weekend rate. `deposit-payment.ts` holds the card-deposit pay-link and webhook logic, with I/O passed in as deps. These modules have no I/O. Change pricing or rules here, not in components, because the quote shown in the UI and the amounts stored in the DB both come from `quote()`.

**Dates:** booking dates are `'YYYY-MM-DD'` strings. Always parse them with `parseLocalDate()` from `lib/dates.ts`, never with `new Date(str)`. UTC parsing shifts the calendar day and breaks weekday and weekend pricing.

**Supabase access:** RLS is enabled on every table (migration `0002`). The anon key can read only `cabins` and approved `reviews`. All booking reads and writes go through `supabaseAdmin()` (service role) in `lib/supabase.ts`, which is `server-only`. Never use it from client components. Schema changes are new numbered files in `supabase/migrations/`, run by hand in the Supabase SQL editor.

**Booking state machine** (`bookings.status`): `REQUESTED → APPROVED → CONFIRMED → COMPLETED`, plus `DECLINED`, `EXPIRED` and `CANCELLED`. A booking holds its cabins while it is REQUESTED, APPROVED or CONFIRMED. Status updates are guarded with `.eq('status', <expected>)` so that repeated or concurrent calls are idempotent. Keep that pattern.

How a booking moves through the system:
1. `app/book/actions.ts` (`createBookingRequest`, a server action) validates input with Zod and prices the stay with `quote()`. It then calls the Postgres function `create_booking_request` (migration `0005`). That function locks each cabin, checks for overlaps with active bookings and `blocked_dates`, and inserts `bookings`, `booking_cabins` and `waivers` in one transaction. The action then emails the owner. Overlap rules live only in that SQL function, and `tests/booking-request-sql.test.ts` runs every migration in PGlite (an in-process Postgres) to test it.
2. The owner approves in one of two ways. The emailed link `GET /api/bookings/[id]/approve?token=…` is checked against `approval_token`. The dashboard at `/owner/dashboard` requires the owner email login. Both call `approveBooking()` in `lib/booking-approval.ts`, which sets APPROVED and emails the guest a link to `/api/bookings/[id]/pay`. That route creates (or reuses) the Stripe Checkout session on click, and refuses to take payment until the booking has a signed waiver (`canPayDeposit` in `lib/owner-rules.ts`).
3. `POST /api/stripe/webhook` handles `checkout.session.completed`. When `metadata.type === 'damage_deposit'`, it records the $500/cabin pre-auth hold. Otherwise it flips APPROVED to CONFIRMED and sends the confirmation email.
4. Vercel crons (`vercel.json`) run once a day (expire-holds at 12:00 UTC = 5 AM Alberta in winter, 6 AM after daylight saving) and require `Authorization: Bearer $CRON_SECRET` (they reject the request if it is not set).
   - `/api/cron/expire-holds` applies the rules in `lib/daily-jobs.ts`. It expires APPROVED bookings 48h after approval and emails the guest. It sends one "pay your deposit" reminder at 24h. It emails the owner a list of REQUESTED bookings older than 24h. It never auto-declines a future request, and only expires REQUESTED bookings whose check-in has already passed.
   - `/api/cron/send-deposit-reminders` sends the damage-deposit request 3 days before check-in.
   - Card checkout sessions are created with `expires_at` capped at the end of the 48h hold, so a card can't be charged after the hold lapses.

**Owner can change dates and cabins** on any unpaid booking (REQUESTED or APPROVED) from the dashboard. This calls the Postgres function `update_booking` (migration `0008`), which re-checks availability and stores the re-priced amounts. For an APPROVED booking it clears the Stripe session and restarts the 48h hold; the action then expires the old session in Stripe and emails the guest. `update_booking_cabins` (0007) is superseded.

**Phone bookings:** the dashboard's "New phone booking" form calls `create_phone_booking` (migration `0009`). The booking is created already APPROVED (`source = 'phone'`) with **no waiver row**. The guest is emailed a link to `/booking/[id]/waiver`, signs there, and only then sees the payment options. Online bookings get their waiver from the booking form. Dashboard owner rules (undo e-transfer, waiver gate, phone form parsing) are pure functions in `lib/owner-rules.ts`.

**Card payments on/off:** `lib/payments-config.ts`. Guests are offered card (deposit by card, $500 damage-deposit card hold) only when `STRIPE_SECRET_KEY` is a live key (`sk_live_`), or `CARD_PAYMENTS=on`; `CARD_PAYMENTS=off` forces it off. While off, pages and emails show only e-transfer, the pay route redirects to the booking page, and the damage-deposit cron sends nothing. Swapping in the live key turns cards on with no code change.

**Email content** lives in `lib/email-templates.ts` as pure, tested functions. `lib/email.ts` only loads the booking and sends. Add-on menu and prices are in `lib/addons.ts`; the stored label must stay stable because bookings store it.

**Auth:** guests have no accounts; they reach their booking, waiver and payment pages through emailed links keyed by the booking's UUID. The owner logs in at `/owner` with a passwordless email link (migration `0010`): `lib/owner-auth.ts` holds the pure rules (allow-list from `OWNER_LOGIN_EMAILS`, else `OWNER_EMAIL`; SHA-256 hashing; rate limit), `lib/owner-session.ts` the cookie and DB side. Links expire in 15 minutes and work once (the emailed link opens `/owner/login/verify`, which needs a button press so email scanners can't burn it); sessions last 30 days. The dashboard lives in `app/owner/_dashboard/` and is served only at `/owner/dashboard`. The old secret link was retired: `/owner/[secret]` now just redirects to the login page, and `OWNER_DASHBOARD_SECRET` is unused. Every action in `_dashboard/actions.ts` re-checks the login with `ownerOk()`. Emailed approve/decline links use a per-booking `approval_token`. Compare secrets with `safeEqual()` from `lib/tokens.ts`.

**Email:** sent with Resend from the kozyhole.ca domain. Do not use em dashes in email copy; they were deliberately removed, and a test enforces it.

**Landing page:** `app/page.tsx` composes the components in `components/sections/*`. Marketing copy comes from `lib/content.ts`, which is the single source of truth and needs no database. Cabin names ("Cabin One/Two/Three") are placeholders until the owner picks real ones. When they change, update both `lib/content.ts` and the Supabase `cabins` table. Brand images are in `public/brand/`. The originals are in `../images/`.

## Pending / phase 2
- Stripe live keys and `STRIPE_WEBHOOK_SECRET` are still waiting on the owner. Production currently uses Stripe test keys.
- Not built yet: handling for Stripe session-expired and payment-failed events, and WhatsApp owner alerts.
