create type booking_status as enum
  ('REQUESTED','APPROVED','CONFIRMED','DECLINED','EXPIRED','COMPLETED');
create type payment_method as enum ('card','etransfer');

create table cabins (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  theme text,
  sleeps int not null default 4,
  max_with_cot int not null default 5,
  description text,
  features text[] default '{}',
  photos text[] default '{}',
  sort_order int not null default 0
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  email text not null,
  phone text not null,
  party_size int not null,
  has_pet boolean not null default false,
  check_in date not null,
  check_out date not null,
  nights int not null,
  nightly_subtotal numeric(10,2) not null,
  gst numeric(10,2) not null,
  total numeric(10,2) not null,
  deposit_amount numeric(10,2) not null,
  payment_method payment_method,
  amount_charged numeric(10,2),
  status booking_status not null default 'REQUESTED',
  stripe_session_id text,
  approval_token text not null,
  addons text[] default '{}',
  notes text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table booking_cabins (
  booking_id uuid references bookings(id) on delete cascade,
  cabin_id uuid references cabins(id),
  primary key (booking_id, cabin_id)
);

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid references cabins(id),
  start_date date not null,
  end_date date not null,
  reason text
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table waivers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  signer_name text not null,
  party_members text[] default '{}',
  agreed boolean not null default false,
  version text not null default 'v1',
  signed_at timestamptz not null default now()
);

create index on bookings (status);
create index on booking_cabins (cabin_id);
create index on blocked_dates (cabin_id);
