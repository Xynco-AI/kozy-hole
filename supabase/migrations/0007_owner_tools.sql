-- Owner tools: change the cabins on a pending request, and track unpaid-deposit reminders.
--
-- update_booking_cabins: lets the owner fix a request (e.g. a guest who picked all 3
-- cabins by mistake) before approving it. Same locking and overlap rules as
-- create_booking_request (0005/0006), ignoring the booking's own current cabins.
-- Only REQUESTED bookings: once approved, a Stripe checkout may exist for the old amount.
--
-- Safe to re-run. The app code that calls this must be deployed AFTER running it.

alter table bookings add column if not exists payment_reminder_sent_at timestamptz;

create or replace function update_booking_cabins(
  p_booking_id uuid,
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
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if v_booking.status <> 'REQUESTED' then
    return jsonb_build_object('ok', false, 'error', 'NOT_PENDING');
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
         and b.check_in < v_booking.check_out
         and v_booking.check_in < b.check_out
    ) or exists (
      select 1
        from blocked_dates bd
       where bd.cabin_id = v_cabin
         and bd.start_date < v_booking.check_out
         and v_booking.check_in <= bd.end_date   -- end_date is the last blocked night (0006)
    ) then
      return jsonb_build_object('ok', false, 'error', 'CABIN_UNAVAILABLE', 'cabin_id', v_cabin);
    end if;
  end loop;

  delete from booking_cabins where booking_id = p_booking_id;
  insert into booking_cabins (booking_id, cabin_id)
    select p_booking_id, unnest(v_cabins);

  update bookings set
    nightly_subtotal = p_nightly_subtotal,
    gst = p_gst,
    total = p_total,
    deposit_amount = p_deposit_amount,
    card_charge = p_card_charge
  where id = p_booking_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function update_booking_cabins(uuid, uuid[], numeric, numeric, numeric, numeric, numeric)
  from public, anon, authenticated;
grant execute on function update_booking_cabins(uuid, uuid[], numeric, numeric, numeric, numeric, numeric)
  to service_role;
