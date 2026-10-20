#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 -U postgres -d postgres -v auth_password="$AUTH_DB_PASSWORD" -v rest_password="$REST_DB_PASSWORD" <<'SQL'
begin;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login noinherit password :'rest_password';
grant anon,authenticated,service_role to authenticator;
create role supabase_auth_admin login noinherit password :'auth_password';
create schema auth authorization supabase_auth_admin;
alter role supabase_auth_admin set search_path=auth,public;
grant create on database postgres to supabase_auth_admin;
create schema extensions;
create extension vector with schema extensions;
create extension pgcrypto with schema extensions;
create extension "uuid-ossp" with schema extensions;
grant usage on schema public,auth,extensions to anon,authenticated,service_role;
grant usage on schema public,extensions to supabase_auth_admin;
create function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
$$;
create function auth.role() returns text language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role');
$$;
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb;
$$;
alter function auth.uid() owner to supabase_auth_admin;
alter function auth.role() owner to supabase_auth_admin;
alter function auth.jwt() owner to supabase_auth_admin;
grant execute on all functions in schema auth to anon,authenticated,service_role;
create schema sivirinia_internal;
revoke all on schema sivirinia_internal from public;
create table sivirinia_internal.migrations(version text primary key,sha256 text not null,applied_at timestamptz not null default now());
commit;
SQL
