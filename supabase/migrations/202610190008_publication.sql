create table public.agent_publications (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, agent_id uuid not null unique,
 token_hash text not null unique check(length(token_hash)=64), enabled boolean not null default true,
 created_by uuid references auth.users on delete set null, created_at timestamptz not null default now(),
 foreign key(organization_id,agent_id) references public.agents(organization_id,id) on delete cascade,
 unique(organization_id,id)
);
create table public.publication_sources (
 organization_id uuid not null, publication_id uuid not null, source_id uuid not null,
 primary key(publication_id,source_id),
 foreign key(organization_id,publication_id) references public.agent_publications(organization_id,id) on delete cascade,
 foreign key(organization_id,source_id) references public.knowledge_sources(organization_id,id) on delete cascade
);
create table public.public_queries (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, publication_id uuid not null,
 question text not null check(length(question) between 2 and 2000), created_at timestamptz not null default now(),
 foreign key(organization_id,publication_id) references public.agent_publications(organization_id,id) on delete cascade
);
create index public_queries_org_time on public.public_queries(organization_id,created_at);
alter table public.agent_publications enable row level security;
alter table public.publication_sources enable row level security;
alter table public.public_queries enable row level security;
revoke all on public.agent_publications,public.publication_sources,public.public_queries from anon,authenticated;
grant select(id,organization_id,agent_id,enabled,created_by,created_at) on public.agent_publications to authenticated;
grant select on public.publication_sources,public.public_queries to authenticated;
create policy publications_manage_read on public.agent_publications for select to authenticated using(public.has_role(organization_id,array['owner','admin']::public.member_role[]));
create policy publication_sources_manage_read on public.publication_sources for select to authenticated using(public.has_role(organization_id,array['owner','admin']::public.member_role[]));
create policy public_queries_manage_read on public.public_queries for select to authenticated using(public.has_role(organization_id,array['owner','admin']::public.member_role[]));
create function public.publish_agent(org uuid, agent uuid, sources uuid[], acknowledgement text) returns text language plpgsql security definer set search_path='' as $$
declare token text:=encode(extensions.gen_random_bytes(32),'hex'); publication uuid;
begin
 if not public.has_role(org,array['owner','admin']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 if acknowledgement is distinct from 'PUBLICAR' then raise exception 'Confirmação inválida'; end if;
 if coalesce(cardinality(sources),0) not between 1 and 100 then raise exception 'Selecione de 1 a 100 fontes autorizadas'; end if;
 perform 1 from public.organizations where id=org for update;
 if not exists(select 1 from public.agents where organization_id=org and id=agent) then raise exception 'Agente não encontrado'; end if;
 if exists(select 1 from unnest(sources) source where not public.can_read_source(org,source)) then raise exception 'Fonte sem permissão'; end if;
 insert into public.agent_publications(organization_id,agent_id,token_hash,created_by) values(org,agent,encode(extensions.digest(token,'sha256'),'hex'),auth.uid())
 on conflict(agent_id) do update set token_hash=excluded.token_hash,enabled=true,created_by=auth.uid() returning id into publication;
 delete from public.publication_sources where publication_id=publication;
 insert into public.publication_sources select distinct org,publication,source from unnest(sources) source;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'agent.published',agent);
 return token;
end $$;
create function public.revoke_publication(org uuid, agent uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 update public.agent_publications set enabled=false where organization_id=org and agent_id=agent;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'agent.unpublished',agent);
end $$;
create function public.public_agent_info(access_token text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',a.name,'description',a.description,'color',a.color)
 from public.agent_publications p join public.agents a on a.id=p.agent_id and a.organization_id=p.organization_id
 where p.enabled and p.token_hash=encode(extensions.digest(access_token,'sha256'),'hex') and length(access_token)=64;
$$;
create function public.reserve_public_question(access_token text, question text) returns uuid language plpgsql security definer set search_path='' as $$
declare publication public.agent_publications; lim integer; used integer; result uuid; period date:=date_trunc('month',now())::date;
begin
 select * into publication from public.agent_publications where enabled and token_hash=encode(extensions.digest(access_token,'sha256'),'hex') and length(access_token)=64;
 if publication.id is null then raise exception 'Agente público indisponível'; end if;
 if length(trim(question)) not between 2 and 2000 then raise exception 'Pergunta inválida'; end if;
 select p.response_limit into lim from public.organizations o join public.plans p on p.id=o.plan_id where o.id=publication.organization_id for update of o;
 -- Recheck under the organization lock so revocation and admission cannot race.
 if not exists(select 1 from public.agent_publications where id=publication.id and enabled and token_hash=publication.token_hash) then raise exception 'Agente público indisponível'; end if;
 if (select count(*) from public.public_queries where organization_id=publication.organization_id and created_at>now()-interval '1 minute')>=10 then raise exception 'Limite de consultas públicas por minuto atingido'; end if;
 insert into public.monthly_usage(organization_id,month) values(publication.organization_id,period) on conflict do nothing;
 select responses into used from public.monthly_usage where organization_id=publication.organization_id and month=period for update;
 if used>=lim then raise exception 'Limite mensal de respostas atingido'; end if;
 update public.monthly_usage set responses=responses+1 where organization_id=publication.organization_id and month=period;
 insert into public.public_queries(organization_id,publication_id,question) values(publication.organization_id,publication.id,question) returning id into result;
 return result;
end $$;
create function public.search_public_knowledge(access_token text, query text, query_embedding extensions.vector(1536) default null, model_name text default null)
returns table(id uuid,source_id uuid,content text,page integer,title text,origin_url text,version integer,score double precision)
language sql stable security definer set search_path='' as $$
 with candidates as (
 select c.id,c.source_id,c.content,c.page,s.title,s.origin_url,s.version,
 ts_rank_cd(c.search_vector,websearch_to_tsquery('portuguese'::regconfig,left(query,2000)))::double precision as lexical,
 case when query_embedding is not null and c.embedding is not null and c.embedding_model=model_name then (1-(c.embedding OPERATOR(extensions.<=>) query_embedding))::double precision else 0 end as semantic
 from public.agent_publications p
 join public.publication_sources allowed on allowed.publication_id=p.id and allowed.organization_id=p.organization_id
 join public.knowledge_sources s on s.id=allowed.source_id and s.organization_id=p.organization_id
 join public.document_chunks c on c.source_id=s.id and c.organization_id=p.organization_id
 where p.enabled and length(access_token)=64 and p.token_hash=encode(extensions.digest(access_token,'sha256'),'hex')
 ) select id,source_id,content,page,title,origin_url,version,(lexical+greatest(semantic,0))::double precision from candidates
 where lexical>0 or semantic>0.35 order by (lexical+greatest(semantic,0)) desc,id limit 8;
$$;
create function public.revoke_publication_after_acl_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.allowed_roles is distinct from new.allowed_roles then
 update public.agent_publications set enabled=false where id in (select publication_id from public.publication_sources where source_id=new.id and organization_id=new.organization_id);
 end if;
 return new;
end $$;
create trigger revoke_publication_after_acl after update of allowed_roles on public.knowledge_sources for each row execute function public.revoke_publication_after_acl_change();
revoke execute on function public.revoke_publication_after_acl_change() from public,anon,authenticated;
revoke execute on function public.publish_agent(uuid,uuid,uuid[],text),public.revoke_publication(uuid,uuid),public.public_agent_info(text),public.reserve_public_question(text,text),public.search_public_knowledge(text,text,extensions.vector,text) from public,anon;
grant execute on function public.publish_agent(uuid,uuid,uuid[],text),public.revoke_publication(uuid,uuid) to authenticated;
grant execute on function public.public_agent_info(text),public.reserve_public_question(text,text),public.search_public_knowledge(text,text,extensions.vector,text) to anon,authenticated;

create function public.revoke_publications_after_publisher_demotion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.role in ('owner','admin') and new.role not in ('owner','admin') then
 update public.agent_publications set enabled=false where organization_id=new.organization_id and created_by=new.user_id;
 end if;
 return new;
end $$;
create trigger revoke_publications_after_demotion after update of role on public.organization_members for each row execute function public.revoke_publications_after_publisher_demotion();
revoke execute on function public.revoke_publications_after_publisher_demotion() from public,anon,authenticated;
