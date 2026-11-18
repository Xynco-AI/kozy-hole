-- Atomic booking request: closes the double-booking race in app/book/actions.ts.
--
-- Previously the app checked availability, then inserted the booking, cabins and
-- waiver as separate calls, so two simultaneous requests for the same cabin/dates
-- could both pass the check. This function takes a per-cabin advisory lock, checks
-- for overlapping active bookings and blocked dates, and inserts everything in one
-- transaction. Concurrent requests for the same cabin wait for each other.
--
-- Safe to re-run (create or replace). Run in the Supabase SQL editor BEFORE deploying
-- the code that calls it.

create or replace function create_booking_request(
  p_guest_name text,
  p_email text,
  p_phone text,
  p_party_size int,
  p_has_pet boolean,
  p_check_in date,
  p_check_out date,
  p_nights int,
  p_nightly_subtotal numeric,
  p_gst numeric,
  p_total numeric,
  p_deposit_amount numeric,
  p_card_charge numeric,
  p_approval_token text,
  p_addons text[],
  p_cabin_ids uuid[],
  p_party_members text[]
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_cabins uuid[];
  v_cabin uuid;
  v_booking_id uuid;
begin
  -- Distinct + sorted so overlapping multi-cabin requests always lock in the same
  -- order and cannot deadlock each other.
  select array_agg(c order by c) into v_cabins
    from (select distinct unnest(p_cabin_ids) as c) s;

  foreach v_cabin in array v_cabins loop
    -- Held until this transaction commits or rolls back.
    perform pg_advisory_xact_lock(hashtextextended('kozyhole_cabin:' || v_cabin::text, 0));
  end loop;

  foreach v_cabin in array v_cabins loop
    -- Date ranges are [check_in, check_out): back-to-back stays do not overlap.
    if exists (
      select 1
        from booking_cabins bc
        join bookings b on b.id = bc.booking_id
       where bc.cabin_id = v_cabin
         and b.status in ('REQUESTED', 'APPROVED', 'CONFIRMED')
         and b.check_in < p_check_out
         and p_check_in < b.check_out
    ) or exists (
      select 1
        from blocked_dates bd
       where bd.cabin_id = v_cabin
         and bd.start_date < p_check_out
         and p_check_in < bd.end_date
    ) then
      return jsonb_build_object('ok', false, 'error', 'CABIN_UNAVAILABLE', 'cabin_id', v_cabin);
    end if;
  end loop;

  insert into bookings (
    guest_name, email, phone, party_size, has_pet, check_in, check_out, nights,
    nightly_subtotal, gst, total, deposit_amount, card_charge, status,
    approval_token, addons
  ) values (
    p_guest_name, p_email, p_phone, p_party_size, p_has_pet, p_check_in, p_check_out, p_nights,
    p_nightly_subtotal, p_gst, p_total, p_deposit_amount, p_card_charge, 'REQUESTED',
    p_approval_token, p_addons
  ) returning id into v_booking_id;

  insert into booking_cabins (booking_id, cabin_id)
    select v_booking_id, unnest(v_cabins);

  insert into waivers (booking_id, signer_name, party_members, agreed)
    values (v_booking_id, p_guest_name, p_party_members, true);

  return jsonb_build_object('ok', true, 'booking_id', v_booking_id);
end;
$$;

-- Server-side only (service role). Supabase grants EXECUTE on new public functions
-- to anon/authenticated by default, so revoke explicitly.
revoke all on function create_booking_request(
  text, text, text, int, boolean, date, date, int, numeric, numeric, numeric, numeric, numeric,
  text, text[], uuid[], text[]
) from public, anon, authenticated;

grant execute on function create_booking_request(
  text, text, text, int, boolean, date, date, int, numeric, numeric, numeric, numeric, numeric,
  text, text[], uuid[], text[]
) to service_role;
