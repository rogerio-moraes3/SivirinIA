-- Optional managed Supabase Before User Created hook. Enable ONLY on staging.
create table sivirinia_internal.staging_allowed_emails (
 email text primary key check (email = lower(trim(email)) and length(email) between 3 and 254)
);
revoke all on sivirinia_internal.staging_allowed_emails from public, anon, authenticated;
grant usage on schema sivirinia_internal to supabase_auth_admin;
grant select on sivirinia_internal.staging_allowed_emails to supabase_auth_admin;
create function public.staging_before_user_created(event jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
 if exists (select 1 from sivirinia_internal.staging_allowed_emails where email = lower(trim(event->'user'->>'email'))) then
   return '{}'::jsonb;
 end if;
 return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','Homologação restrita a contas de teste autorizadas.'));
end;
$$;
revoke all on function public.staging_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.staging_before_user_created(jsonb) to supabase_auth_admin;
