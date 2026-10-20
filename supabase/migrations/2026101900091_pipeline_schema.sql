-- Also supports SQL migrations on managed Supabase without the local bootstrap.
create schema if not exists sivirinia_internal;
revoke all on schema sivirinia_internal from public,anon,authenticated;
