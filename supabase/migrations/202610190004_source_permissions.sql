create function public.set_source_roles(org uuid, source uuid, roles public.member_role[]) returns void language plpgsql security definer set search_path='' as $$
declare allowed public.member_role[];
begin
 if not public.has_role(org,array['owner','admin']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 allowed:=array(select distinct unnest(coalesce(roles,array[]::public.member_role[])||array['owner','admin']::public.member_role[]));
 perform 1 from public.organizations where id=org for update;
 if not exists(select 1 from public.knowledge_sources where id=source and organization_id=org) then raise exception 'Fonte não encontrada'; end if;
 update public.knowledge_sources set allowed_roles=allowed where id=source and organization_id=org;
 -- Revoke historical derived excerpts for users whose current role is no longer authorized.
 update public.messages m set content='O acesso a uma fonte desta resposta foi alterado. A resposta e os trechos foram removidos.',citations='[]',mode='abstention'
 where m.organization_id=org and exists(select 1 from jsonb_array_elements(m.citations) r where r->>'source_id'=source::text)
 and exists(select 1 from public.conversations c join public.organization_members om on om.organization_id=c.organization_id and om.user_id=c.user_id where c.id=m.conversation_id and not(om.role=any(allowed)));
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'source.permissions_changed',source);
end $$;
revoke execute on function public.set_source_roles(uuid,uuid,public.member_role[]) from public,anon;
grant execute on function public.set_source_roles(uuid,uuid,public.member_role[]) to authenticated;
-- Editors may only mutate sources they can read. Administrative roles are always retained in source ACLs.
create or replace function public.delete_source(org uuid, source uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) or not public.can_read_source(org,source) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 delete from public.knowledge_sources where id=source and organization_id=org;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'source.deleted',source);
end $$;
-- Guard updates at the table boundary as well, including SECURITY DEFINER entry points.
create function public.check_source_update_access() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and not public.can_read_source(old.organization_id,old.id) then raise exception 'Sem permissão'; end if;
 return new;
end $$;
create trigger source_update_access before update on public.knowledge_sources for each row execute function public.check_source_update_access();
revoke execute on function public.check_source_update_access() from public,anon,authenticated;
