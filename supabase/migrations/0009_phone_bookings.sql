-- Phone bookings: the owner enters a booking for a guest who called.
--
-- The booking is created already APPROVED (the owner agreed on the phone), so the 48h
-- deposit hold starts now. Unlike create_booking_request, NO waiver row is created: the
-- guest is emailed a link to sign the waiver themselves, and can't pay until they have.
-- Same locking and overlap rules as create_booking_request (0005/0006).
--
-- Safe to re-run. Run BEFORE deploying the code that calls it.

alter table bookings add column if not exists source text not null default 'online';
alter table bookings drop constraint if exists bookings_source_check;
alter table bookings add constraint bookings_source_check check (source in ('online', 'phone'));

create or replace function create_phone_booking(
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
  p_cabin_ids uuid[]
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_cabins uuid[];
  v_cabin uuid;
  v_booking_id uuid;
begin
  if p_check_out <= p_check_in then
    return jsonb_build_object('ok', false, 'error', 'INVALID_DATES');
  end if;

  select array_agg(c order by c) into v_cabins
    from (select distinct unnest(p_cabin_ids) as c) s;
  if v_cabins is null then
    return jsonb_build_object('ok', false, 'error', 'NO_CABINS');
  end if;

  -- Same lock keys and order as create_booking_request.
  foreach v_cabin in array v_cabins loop
    perform pg_advisory_xact_lock(hashtextextended('kozyhole_cabin:' || v_cabin::text, 0));
  end loop;

  foreach v_cabin in array v_cabins loop
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
         and p_check_in <= bd.end_date   -- end_date is the last blocked night (0006)
    ) then
      return jsonb_build_object('ok', false, 'error', 'CABIN_UNAVAILABLE', 'cabin_id', v_cabin);
    end if;
  end loop;

  insert into bookings (
    guest_name, email, phone, party_size, has_pet, check_in, check_out, nights,
    nightly_subtotal, gst, total, deposit_amount, card_charge, status, approved_at,
    approval_token, addons, source
  ) values (
    p_guest_name, p_email, p_phone, p_party_size, p_has_pet, p_check_in, p_check_out, p_nights,
    p_nightly_subtotal, p_gst, p_total, p_deposit_amount, p_card_charge, 'APPROVED', now(),
    p_approval_token, p_addons, 'phone'
  ) returning id into v_booking_id;

  insert into booking_cabins (booking_id, cabin_id)
    select v_booking_id, unnest(v_cabins);

  return jsonb_build_object('ok', true, 'booking_id', v_booking_id);
end;
$$;

revoke all on function create_phone_booking(
  text, text, text, int, boolean, date, date, int, numeric, numeric, numeric, numeric, numeric,
  text, text[], uuid[]
) from public, anon, authenticated;

grant execute on function create_phone_booking(
  text, text, text, int, boolean, date, date, int, numeric, numeric, numeric, numeric, numeric,
  text, text[], uuid[]
) to service_role;
