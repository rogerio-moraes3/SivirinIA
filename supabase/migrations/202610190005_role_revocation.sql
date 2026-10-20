create function public.redact_after_role_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.role=new.role then return new; end if;
 update public.messages m set content='Seu acesso a uma fonte foi alterado. A resposta e os trechos foram removidos.',citations='[]',mode='abstention'
 from public.conversations c
 where m.conversation_id=c.id and c.organization_id=new.organization_id and c.user_id=new.user_id
 and exists(select 1 from jsonb_array_elements(m.citations) r join public.knowledge_sources s on s.id=(r->>'source_id')::uuid and s.organization_id=new.organization_id where not(new.role=any(s.allowed_roles)));
 return new;
end $$;
create trigger redact_role_change after update of role on public.organization_members for each row execute function public.redact_after_role_change();
revoke execute on function public.redact_after_role_change() from public,anon,authenticated;
