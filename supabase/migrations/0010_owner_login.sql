-- Owner email login (passwordless) for kozyhole.ca/owner.
--
-- The owner types their email; if it's on the allow-list the app emails a one-time
-- link. Only SHA-256 hashes of link tokens and session tokens are stored, so reading
-- these tables never gives anyone a usable login. Links expire after 15 minutes and
-- work once; sessions last 30 days and can be revoked by deleting the row.
--
-- Server-only (service role). Safe to re-run. Run BEFORE deploying the code that uses it.

create table if not exists owner_login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists owner_login_tokens_email_created on owner_login_tokens (email, created_at);

create table if not exists owner_sessions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Supabase grants new public tables to anon/authenticated by default: lock them down.
alter table owner_login_tokens enable row level security;
alter table owner_sessions enable row level security;
revoke all on owner_login_tokens from anon, authenticated;
revoke all on owner_sessions from anon, authenticated;

-- Use a login link exactly once and open a session. Returns the owner's email, or
-- null if the link is unknown, already used, or expired.
create or replace function owner_login(
  p_token_hash text,
  p_session_hash text,
  p_session_days int
) returns text
language plpgsql
set search_path = public
as $$
declare
  v_email text;
begin
  update owner_login_tokens
     set used_at = now()
   where token_hash = p_token_hash
     and used_at is null
     and expires_at > now()
  returning email into v_email;

  if v_email is null then
    return null;
  end if;

  insert into owner_sessions (email, token_hash, expires_at)
    values (v_email, p_session_hash, now() + make_interval(days => p_session_days));

  -- Housekeeping: drop old links and expired sessions.
  delete from owner_login_tokens where created_at < now() - interval '7 days';
  delete from owner_sessions where expires_at < now();

  return v_email;
end;
$$;

revoke all on function owner_login(text, text, int) from public, anon, authenticated;
grant execute on function owner_login(text, text, int) to service_role;
