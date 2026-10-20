create function public.delete_agent(org uuid, agent uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 delete from public.agents where id=agent and organization_id=org;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'agent.deleted',agent);
end $$;
-- An update reserves only the replacement footprint; creation reserves its full footprint.
create function public.reserve_ingestion(org uuid, hash text, pages integer, source uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare lim integer; total integer; job uuid;
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 if pages not between 1 and 5000 or length(hash)<>64 then raise exception 'Documento inválido'; end if;
 select p.page_limit into lim from public.organizations o join public.plans p on p.id=o.plan_id where o.id=org for update of o;
 if source is not null and not exists(select 1 from public.knowledge_sources where id=source and organization_id=org and public.can_read_source(org,id)) then raise exception 'Fonte não encontrada'; end if;
 update public.ingestion_jobs set status='failed',finished_at=now() where organization_id=org and status='processing' and created_at<now()-interval '10 minutes';
 if (select count(*) from public.ingestion_jobs where organization_id=org and created_at>now()-interval '1 minute')>=5 then raise exception 'Limite de importações por minuto atingido'; end if;
 if exists(select 1 from public.ingestion_jobs where organization_id=org and status='processing') then raise exception 'Documento já está em processamento. Aguarde a conclusão.'; end if;
 if exists(select 1 from public.knowledge_sources where organization_id=org and content_hash=hash) then raise exception 'Documento duplicado'; end if;
 select coalesce(sum(page_count),0) into total from public.knowledge_sources where organization_id=org and (source is null or id<>source);
 if total+pages>lim then raise exception 'Limite de páginas atingido'; end if;
 insert into public.ingestion_jobs(organization_id,user_id,content_hash,reserved_pages) values(org,auth.uid(),hash,pages) returning id into job;
 return job;
end $$;
revoke execute on function public.delete_agent(uuid,uuid),public.reserve_ingestion(uuid,text,integer,uuid) from public,anon;
grant execute on function public.delete_agent(uuid,uuid),public.reserve_ingestion(uuid,text,integer,uuid) to authenticated;
