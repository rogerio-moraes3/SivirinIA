alter table public.agents add column use_all_sources boolean not null default true;
create table public.agent_sources (
 organization_id uuid not null, agent_id uuid not null, source_id uuid not null,
 primary key(agent_id,source_id),
 foreign key(organization_id,agent_id) references public.agents(organization_id,id) on delete cascade,
 foreign key(organization_id,source_id) references public.knowledge_sources(organization_id,id) on delete cascade
);
alter table public.agent_sources enable row level security;
revoke all on public.agent_sources from anon,authenticated;
grant select on public.agent_sources to authenticated;
create policy agent_sources_read on public.agent_sources for select to authenticated using(public.has_role(organization_id) and public.can_read_source(organization_id,source_id));
create function public.configure_agent_sources(org uuid, agent uuid, all_sources boolean, sources uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 if not exists(select 1 from public.agents where id=agent and organization_id=org) then raise exception 'Agente não encontrado'; end if;
 if cardinality(sources)>500 then raise exception 'Limite de fontes por agente atingido'; end if;
 if exists(select 1 from unnest(sources) s where not public.can_read_source(org,s)) then raise exception 'Fonte sem permissão'; end if;
 update public.agents set use_all_sources=all_sources where id=agent and organization_id=org;
 delete from public.agent_sources where agent_id=agent and organization_id=org;
 insert into public.agent_sources(organization_id,agent_id,source_id) select distinct org,agent,s from unnest(sources) s;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'agent.sources_changed',agent);
end $$;
create function public.search_agent_knowledge(org uuid, agent uuid, query text, query_embedding extensions.vector(1536) default null, model_name text default null)
returns table(id uuid,source_id uuid,content text,page integer,title text,origin_url text,version integer,score double precision)
language sql stable security invoker set search_path='' as $$
 with candidates as (
 select c.id,c.source_id,c.content,c.page,s.title,s.origin_url,s.version,
 ts_rank_cd(c.search_vector,websearch_to_tsquery('portuguese'::regconfig,left(query,2000)))::double precision as lexical,
 case when query_embedding is not null and c.embedding is not null and c.embedding_model=model_name then (1-(c.embedding OPERATOR(extensions.<=>) query_embedding))::double precision else 0 end as semantic
 from public.document_chunks c
 join public.knowledge_sources s on s.id=c.source_id and s.organization_id=c.organization_id
 join public.agents a on a.id=agent and a.organization_id=c.organization_id
 where c.organization_id=org and public.can_read_source(org,c.source_id)
 and (a.use_all_sources or exists(select 1 from public.agent_sources allowed where allowed.agent_id=a.id and allowed.source_id=c.source_id and allowed.organization_id=org))
 ) select id,source_id,content,page,title,origin_url,version,(lexical+greatest(semantic,0))::double precision from candidates
 where lexical>0 or semantic>0.35 order by (lexical+greatest(semantic,0)) desc,id limit 8;
$$;
revoke execute on function public.configure_agent_sources(uuid,uuid,boolean,uuid[]),public.search_agent_knowledge(uuid,uuid,text,extensions.vector,text) from public,anon;
grant execute on function public.configure_agent_sources(uuid,uuid,boolean,uuid[]),public.search_agent_knowledge(uuid,uuid,text,extensions.vector,text) to authenticated;
