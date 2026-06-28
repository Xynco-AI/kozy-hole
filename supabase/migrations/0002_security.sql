-- Lock down all tables; service_role (used server-side) bypasses RLS automatically.
alter table cabins enable row level security;
alter table bookings enable row level security;
alter table booking_cabins enable row level security;
alter table blocked_dates enable row level security;
alter table reviews enable row level security;
alter table waivers enable row level security;

-- The browser anon key may read ONLY public marketing data:
create policy "anon_read_cabins" on cabins for select to anon using (true);
create policy "anon_read_approved_reviews" on reviews for select to anon using (approved = true);
-- No anon policies on bookings, booking_cabins, blocked_dates, waivers => anon has NO access.

-- Store the exact card charge quoted at request time (see FIX 4).
alter table bookings add column if not exists card_charge numeric(10,2);
