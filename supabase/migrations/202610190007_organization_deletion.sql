create function public.delete_organization(org uuid, confirmation text) returns void language plpgsql security definer set search_path='' as $$
declare org_name text;
begin
 if not public.has_role(org,array['owner']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 select name into org_name from public.organizations where id=org for update;
 if confirmation is distinct from org_name then raise exception 'Nome da organização inválido para confirmar exclusão'; end if;
 delete from public.organizations where id=org;
end $$;
revoke execute on function public.delete_organization(uuid,text) from public,anon;
grant execute on function public.delete_organization(uuid,text) to authenticated;
