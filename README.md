# Kozy Hole Ice Shack Rentals — kozyhole.ca

A booking website for **Kozy Hole Ice Shack Rentals**, a family-run business renting fully-equipped, heated ice fishing shacks on **Lac la Biche Lake, Alberta**.

---

## The objective

**Turn a manual, phone-and-text rental operation into a self-serve booking website that fills cabins with less back-and-forth — while keeping the owners in control of every booking.**

Rob and Jason rent three ice shacks each winter. Without a website, every booking means trading messages to check dates, quote prices, collect a deposit, and chase paperwork. The objective of this site is to handle all of that automatically:

1. **Show the offering clearly** — let guests see the cabins, what's included, the rates, and the policies without having to ask.
2. **Take bookings online, 24/7** — guests pick cabins and dates, get an instant accurate price (with the weekend/holiday and 2-night-minimum rules built in), sign the waiver, and request their stay.
3. **Keep the owners in control** — nothing is confirmed until an owner approves it, so they can manage ice conditions, weather, and scheduling. They're alerted the moment a request comes in.
4. **Collect the deposit automatically** — once approved, the guest pays the 50% deposit by card or e-transfer, which locks the dates. The balance and damage deposit are handled on arrival.
5. **Prevent mistakes** — no double-bookings, no pricing errors, no lost waivers, no missed requests.

The goal is simple: **less time on logistics, more cabins booked, and a professional experience that builds trust for a brand-new business.**

---

## Who it's for

- **Guests** — anglers, families, and groups looking for a comfortable, fully-equipped ice fishing weekend. They can browse, price out a stay, and book in a few minutes.
- **The owners (Rob & Jason)** — who get instant booking alerts, one-tap approve/decline, automatic deposit collection, and a simple private dashboard to manage everything — no logins, no software to learn.

---

## What it does

### For guests
- Browse the 3 cabins, amenities, rates, location, and policies
- Pick one or more cabins and a date range (only valid, in-season, available dates)
- See a live, accurate price: nightly total, 5% GST, and the 50% deposit due
- Choose card (+3% fee) or e-transfer (no fee) for the deposit
- Sign a digital waiver as part of booking
- Track their booking status and pay the deposit once approved

### For the owners
- Get an **email alert** (WhatsApp coming in phase 2) for every new request, with one-tap **Approve / Decline**
- A private dashboard (`/owner/<secret>`) to review requests, confirm e-transfer payments, block dates, mark stays complete, and approve guest reviews
- Automatic confirmation emails to guests; automatic release of holds left unpaid for 48 hours

---

## How a booking flows

```
Guest requests dates + signs waiver
        │
        ▼
Owner gets an alert → Approves or Declines
        │ (approved)
        ▼
Guest pays 50% deposit (Stripe card or e-transfer)
        │
        ▼
Booking CONFIRMED — dates locked, both sides emailed
        │
        ▼
Balance + $500 damage deposit (+ $50 pet fee) collected on arrival at the lake
```

## Key business rules baked in

- **Rates:** $350/night weekday, $450/night weekends & holidays
- **2-night minimum** on weekends
- **5% GST** on the online total; **3% surcharge** on card payments only
- **50% deposit** to book; balance, **$500/cabin damage deposit**, and **$50/stay pet fee** due on arrival
- **Season:** December 15 – March 31 (recurring yearly)
- **Cancellation:** 1 week notice for a credit toward a future stay; no refunds
- **Check-in 1 PM / check-out 11 AM**

---

## Tech & project docs

Built with **Next.js (App Router) + Supabase (Postgres) + Stripe + Resend**, hosted on Vercel.

- **Design spec** (full requirements & data model): [`../docs/superpowers/specs/2026-06-25-kozy-hole-booking-site-design.md`](../docs/superpowers/specs/2026-06-25-kozy-hole-booking-site-design.md)
- **Implementation plan**: [`../docs/superpowers/plans/2026-06-25-kozy-hole-booking-site.md`](../docs/superpowers/plans/2026-06-25-kozy-hole-booking-site.md)
- **Deploy runbook** (go-live steps): [`DEPLOY.md`](DEPLOY.md)

### Run locally
```bash
npm install
cp .env.local.example .env.local   # fill in real keys to use live data
npm run dev                         # http://localhost:3000
npm test                            # unit tests for pricing/availability/season
```

> Note: this project uses a newer version of Next.js — see [`AGENTS.md`](AGENTS.md) before changing code.
