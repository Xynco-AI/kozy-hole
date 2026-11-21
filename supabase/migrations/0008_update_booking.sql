-- Owner can change the DATES and/or cabins of any unpaid booking (REQUESTED or APPROVED).
--
-- Supersedes update_booking_cabins (0007, kept so older deployed code keeps working).
-- Same locking and overlap rules as create_booking_request, ignoring the booking's own rows.
-- For an APPROVED booking the old Stripe checkout no longer matches the price, so its id is
-- cleared (and returned so the app can expire it in Stripe), and the 48h hold restarts.
-- Paid (CONFIRMED) and closed bookings are not editable.
--
-- Safe to re-run. Run BEFORE deploying the code that calls it.

create or replace function update_booking(
  p_booking_id uuid,
  p_check_in date,
  p_check_out date,
  p_nights int,
  p_cabin_ids uuid[],
  p_nightly_subtotal numeric,
  p_gst numeric,
  p_total numeric,
  p_deposit_amount numeric,
  p_card_charge numeric
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_booking bookings%rowtype;
  v_cabins uuid[];
  v_cabin uuid;
begin
  if p_check_out <= p_check_in then
    return jsonb_build_object('ok', false, 'error', 'INVALID_DATES');
  end if;

  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if v_booking.status not in ('REQUESTED', 'APPROVED') then
    return jsonb_build_object('ok', false, 'error', 'NOT_EDITABLE');
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
         and bc.booking_id <> p_booking_id
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

  delete from booking_cabins where booking_id = p_booking_id;
  insert into booking_cabins (booking_id, cabin_id)
    select p_booking_id, unnest(v_cabins);

  update bookings set
    check_in = p_check_in,
    check_out = p_check_out,
    nights = p_nights,
    nightly_subtotal = p_nightly_subtotal,
    gst = p_gst,
    total = p_total,
    deposit_amount = p_deposit_amount,
    card_charge = p_card_charge,
    stripe_session_id = case when v_booking.status = 'APPROVED' then null else stripe_session_id end,
    approved_at = case when v_booking.status = 'APPROVED' then now() else approved_at end,
    payment_reminder_sent_at = case when v_booking.status = 'APPROVED' then null else payment_reminder_sent_at end
  where id = p_booking_id;

  return jsonb_build_object(
    'ok', true,
    'previous_status', v_booking.status,
    'old_session_id', case when v_booking.status = 'APPROVED' then v_booking.stripe_session_id else null end
  );
end;
$$;

revoke all on function update_booking(uuid, date, date, int, uuid[], numeric, numeric, numeric, numeric, numeric)
  from public, anon, authenticated;
grant execute on function update_booking(uuid, date, date, int, uuid[], numeric, numeric, numeric, numeric, numeric)
  to service_role;
