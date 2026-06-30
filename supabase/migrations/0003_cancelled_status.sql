-- Add a CANCELLED status. (Run as a standalone statement; Postgres does not allow
-- ALTER TYPE ... ADD VALUE inside a transaction block in older versions.)
alter type booking_status add value if not exists 'CANCELLED';
