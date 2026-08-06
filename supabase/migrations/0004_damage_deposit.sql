alter table bookings
  add column if not exists damage_deposit_session_id text,
  add column if not exists damage_deposit_intent_id  text,
  add column if not exists damage_deposit_status     text
    check (damage_deposit_status in ('authorized','released','captured'));
