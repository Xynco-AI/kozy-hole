# Kozy Hole — Deploy Runbook

The site is built and committed. These are the go-live steps, in order. Everything here needs an account login, which is why it's on you (Austin), not the code.

## 1. Push to GitHub
- Create a new GitHub repo and push this `kozyhole/` folder to it.

## 2. Supabase (database)
- Create a Supabase project.
- In the SQL editor, run, in order:
  1. `supabase/migrations/0001_init.sql`
  2. `supabase/migrations/0002_security.sql`  ← enables Row Level Security + adds card_charge column (do NOT skip)
  3. `supabase/migrations/0003_cancelled_status.sql`  ← adds CANCELLED booking status (must run outside a transaction)
  4. `supabase/seed.sql`  ← seeds the 3 cabins (rename them once Rob picks names)
- From Project Settings → API, copy: **Project URL**, **anon public key**, **service_role key**.

## 3. Stripe (deposit payments)
- Create a Stripe account. Start in **Test mode**.
- Copy the **Secret key** (`sk_test_...`).
- After the site is deployed (step 6), add a webhook: endpoint `https://kozyhole.ca/api/stripe/webhook`, event `checkout.session.completed`. Copy its **Signing secret** (`whsec_...`).

## 4. Resend (email)
- Create a Resend account.
- Add and **verify the kozyhole.ca domain** (add the DNS records Resend gives you). Sending from `bookings@kozyhole.ca` will NOT work until this is verified.
- Copy the **API key** (`re_...`).

## 5. Vercel (hosting)
- Import the GitHub repo into Vercel (framework auto-detects as Next.js).
- Set Environment Variables (Production):
  | Variable | Value |
  |---|---|
  | `NEXT_PUBLIC_SITE_URL` | `https://kozyhole.ca` |
  | `NEXT_PUBLIC_SUPABASE_URL` | from step 2 |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 2 |
  | `SUPABASE_SERVICE_ROLE_KEY` | from step 2 (keep secret) |
  | `STRIPE_SECRET_KEY` | from step 3 |
  | `STRIPE_WEBHOOK_SECRET` | from step 3 (after webhook is created) |
  | `RESEND_API_KEY` | from step 4 |
  | `OWNER_EMAIL` | `kozyhole@gmail.com` |
  | `OWNER_DASHBOARD_SECRET` | a long random string — this IS the owner login URL |
  | `CRON_SECRET` | a long random string (required, or the cron is rejected) |
- Deploy.

## 6. Domain
- Point `kozyhole.ca` DNS at Vercel (Vercel gives the exact records). Confirm HTTPS works.

## 7. Test, then go live
- With Stripe in **test mode**, run a full booking: request → approve from the owner email → pay with a Stripe test card → confirm the booking flips to CONFIRMED and emails arrive.
- The owner dashboard lives at `https://kozyhole.ca/owner/<OWNER_DASHBOARD_SECRET>` — bookmark it on Rob's phone.
- When happy, swap Stripe to **live keys** and update the webhook secret.

## Still to fill in before launch (waiting on Rob)
- **Cabin names** — currently placeholders ("Cabin One/Two/Three"). Update in Supabase `cabins` table (and `lib/content.ts`).
- **Holiday list** for the $450 rate — currently defaults to Alberta stat holidays (Christmas, Boxing Day, New Year's, Family Day) in `lib/holidays.ts`.
- **Add-on prices** — only the $60 shuttle is set; bait/rod/sonar/guided are listed without prices.

## Phase 2 (after launch)
- **WhatsApp alerts** via Meta WhatsApp Cloud API (email alerts work from day one).
- Stripe `checkout.session.expired` / payment-failure handling (there are `TODO(phase2)` markers in the code).
- Optimize the brand PNGs (they're ~12 MB total) to WebP for faster loads.
