-- Deterministic Portuguese question normalization, not semantic understanding.
create function public.knowledge_query(question text) returns tsquery language plpgsql immutable set search_path='' as $$
declare normalized text; result tsquery;
begin
 if position('"' in question)>0 or question ~ '\mOR\M|(^|[[:space:]])-' then
  return websearch_to_tsquery('portuguese'::regconfig,left(question,2000));
 end if;
 normalized:=regexp_replace(lower(left(question,2000)), '\m(qual|quais|como|funciona|funcionam|exige|exigem|prazo|prazos|horário|horários)\M',' ','g');
 result:=websearch_to_tsquery('portuguese'::regconfig,normalized);
 if numnode(result)=0 then return websearch_to_tsquery('portuguese'::regconfig,left(question,2000)); end if;
 return result;
end $$;
revoke execute on function public.knowledge_query(text) from public;
grant execute on function public.knowledge_query(text) to anon,authenticated;

create or replace function public.search_knowledge(org uuid, query text, query_embedding extensions.vector(1536) default null, model_name text default null)
returns table(id uuid,source_id uuid,content text,page integer,title text,origin_url text,version integer,score double precision)
language sql stable security invoker set search_path='' as $$
 with candidates as (
 select c.id,c.source_id,c.content,c.page,s.title,s.origin_url,s.version,
 ts_rank_cd(c.search_vector,websearch_to_tsquery('portuguese',left(query,2000)))::double precision as lexical,
 case when query_embedding is not null and c.embedding is not null and c.embedding_model=model_name then (1-(c.embedding OPERATOR(extensions.<=>) query_embedding))::double precision else 0 end as semantic
 from public.document_chunks c join public.knowledge_sources s on s.id=c.source_id and s.organization_id=c.organization_id
 where c.organization_id=org and public.can_read_source(org,c.source_id)
 ) select id,source_id,content,page,title,origin_url,version,(lexical+greatest(semantic,0))::double precision from candidates
 where lexical>0 or semantic>0.35 order by (lexical+greatest(semantic,0)) desc,id limit 8;
$$;

create or replace function public.search_agent_knowledge(org uuid, agent uuid, query text, query_embedding extensions.vector(1536) default null, model_name text default null)
returns table(id uuid,source_id uuid,content text,page integer,title text,origin_url text,version integer,score double precision)
language sql stable security invoker set search_path='' as $$
 with candidates as (
 select c.id,c.source_id,c.content,c.page,s.title,s.origin_url,s.version,
 ts_rank_cd(c.search_vector,public.knowledge_query(query))::double precision as lexical,
 case when query_embedding is not null and c.embedding is not null and c.embedding_model=model_name then (1-(c.embedding OPERATOR(extensions.<=>) query_embedding))::double precision else 0 end as semantic
 from public.document_chunks c
 join public.knowledge_sources s on s.id=c.source_id and s.organization_id=c.organization_id
 join public.agents a on a.id=agent and a.organization_id=c.organization_id
 where c.organization_id=org and public.can_read_source(org,c.source_id)
 and (a.use_all_sources or exists(select 1 from public.agent_sources allowed where allowed.agent_id=a.id and allowed.source_id=c.source_id and allowed.organization_id=org))
 ) select id,source_id,content,page,title,origin_url,version,(lexical+greatest(semantic,0))::double precision from candidates
 where lexical>0 or semantic>0.35 order by (lexical+greatest(semantic,0)) desc,id limit 8;
$$;

create or replace function public.search_public_knowledge(access_token text, query text, query_embedding extensions.vector(1536) default null, model_name text default null)
returns table(id uuid,source_id uuid,content text,page integer,title text,origin_url text,version integer,score double precision)
language sql stable security definer set search_path='' as $$
 with candidates as (
 select c.id,c.source_id,c.content,c.page,s.title,s.origin_url,s.version,
 ts_rank_cd(c.search_vector,public.knowledge_query(query))::double precision as lexical,
 case when query_embedding is not null and c.embedding is not null and c.embedding_model=model_name then (1-(c.embedding OPERATOR(extensions.<=>) query_embedding))::double precision else 0 end as semantic
 from public.agent_publications p
 join public.publication_sources allowed on allowed.publication_id=p.id and allowed.organization_id=p.organization_id
 join public.knowledge_sources s on s.id=allowed.source_id and s.organization_id=p.organization_id
 join public.document_chunks c on c.source_id=s.id and c.organization_id=p.organization_id
 where p.enabled and length(access_token)=64 and p.token_hash=encode(extensions.digest(access_token,'sha256'),'hex')
 ) select id,source_id,content,page,title,origin_url,version,(lexical+greatest(semantic,0))::double precision from candidates
 where lexical>0 or semantic>0.35 order by (lexical+greatest(semantic,0)) desc,id limit 8;
$$;
