create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create type public.member_role as enum ('owner','admin','editor','analyst','viewer');
create table public.plans (
 id text primary key, name text not null, monthly_cents integer not null check(monthly_cents>=0),
 agent_limit integer not null, page_limit integer not null, response_limit integer not null
);
insert into public.plans values ('free','Gratuito',0,1,50,50),('essential','Essencial',9700,1,2000,1000),('professional','Profissional',29700,3,10000,5000),('business','Empresarial',89700,10,50000,20000);
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100),
 plan_id text not null default 'free' references public.plans, created_at timestamptz not null default now()
);
create table public.organization_members (
 organization_id uuid not null references public.organizations on delete cascade,
 user_id uuid not null references auth.users on delete cascade, role public.member_role not null default 'viewer',
 created_at timestamptz not null default now(), primary key(organization_id,user_id)
);
create index members_user_idx on public.organization_members(user_id);
create function public.has_role(org uuid, roles public.member_role[] default array['owner','admin','editor','analyst','viewer']::public.member_role[])
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid() and m.role=any(roles));
$$;
create table public.agents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 name text not null check(length(name) between 2 and 100), description text not null default '' check(length(description)<=1000),
 instructions text not null default '' check(length(instructions)<=4000), color text not null default '#18d3ea',
 created_at timestamptz not null default now(), unique(organization_id,id)
);
create table public.knowledge_sources (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 title text not null check(length(title) between 1 and 250), kind text not null check(kind in ('text','pdf','docx','url','markdown','csv','html')),
 origin_url text, content_hash text not null, version integer not null default 1,
 page_count integer not null check(page_count>0), char_count integer not null,
 allowed_roles public.member_role[] not null default array['owner','admin','editor','analyst','viewer']::public.member_role[],
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,content_hash)
);
create function public.can_read_source(org uuid, source uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.knowledge_sources s join public.organization_members m on m.organization_id=s.organization_id
 where s.id=source and s.organization_id=org and m.user_id=auth.uid() and m.role=any(s.allowed_roles));
$$;
create table public.source_versions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, source_id uuid not null,
 version integer not null, content_hash text not null, page_count integer not null, created_at timestamptz not null default now(),
 foreign key(organization_id,source_id) references public.knowledge_sources(organization_id,id) on delete cascade,
 unique(source_id,version)
);
create table public.document_chunks (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, source_id uuid not null,
 position integer not null, page integer, content text not null check(length(content) between 1 and 6000),
 embedding extensions.vector(1536), embedding_model text,
 search_vector tsvector generated always as (to_tsvector('portuguese'::regconfig, content)) stored,
 foreign key(organization_id,source_id) references public.knowledge_sources(organization_id,id) on delete cascade,
 unique(source_id,position)
);
create index chunks_search_idx on public.document_chunks using gin(search_vector);
create index chunks_org_idx on public.document_chunks(organization_id,source_id);
create table public.conversations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, agent_id uuid not null,
 user_id uuid not null references auth.users on delete cascade, title text not null, created_at timestamptz not null default now(),
 foreign key(organization_id,agent_id) references public.agents(organization_id,id) on delete cascade,
 unique(organization_id,id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, conversation_id uuid not null,
 role text not null check(role in ('user','assistant')), content text not null,
 sequence bigint generated always as identity, reply_to uuid references public.messages(id) on delete cascade,
 status text not null default 'complete' check(status in ('pending','complete','failed')),
 mode text check(mode in ('extractive','generative','abstention')), citations jsonb not null default '[]',
 input_tokens integer not null default 0, output_tokens integer not null default 0, model text,
 cost_usd numeric, latency_ms integer, created_at timestamptz not null default now(),
 foreign key(organization_id,conversation_id) references public.conversations(organization_id,id) on delete cascade
);
create index conversations_org_idx on public.conversations(organization_id,user_id,created_at);
create index messages_conversation_idx on public.messages(conversation_id,created_at);
create table public.monthly_usage (
 organization_id uuid not null references public.organizations on delete cascade, month date not null,
 responses integer not null default 0 check(responses>=0), primary key(organization_id,month)
);
create table public.audit_logs (
 id bigint generated always as identity primary key, organization_id uuid not null references public.organizations on delete cascade,
 user_id uuid references auth.users on delete set null, action text not null, entity_id uuid, created_at timestamptz not null default now()
);
create table public.feedback (
 organization_id uuid not null, message_id uuid not null references public.messages on delete cascade,
 user_id uuid not null references auth.users on delete cascade, helpful boolean not null, created_at timestamptz not null default now(),
 primary key(message_id,user_id)
);
-- Explicit grants: all writes pass through validated transactional RPCs.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.plans to anon, authenticated;
grant select on public.organizations, public.organization_members, public.agents, public.knowledge_sources,
 public.source_versions, public.document_chunks, public.conversations, public.messages, public.monthly_usage, public.audit_logs, public.feedback to authenticated;
grant insert,update on public.feedback to authenticated;
alter table public.plans enable row level security;
create policy plans_read on public.plans for select using(true);
alter table public.organizations enable row level security;
create policy org_read on public.organizations for select to authenticated using(public.has_role(id));
alter table public.organization_members enable row level security;
create policy members_read on public.organization_members for select to authenticated using(public.has_role(organization_id));
alter table public.agents enable row level security;
create policy agents_read on public.agents for select to authenticated using(public.has_role(organization_id));
alter table public.knowledge_sources enable row level security;
create policy sources_read on public.knowledge_sources for select to authenticated using(public.can_read_source(organization_id,id));
alter table public.source_versions enable row level security;
create policy versions_read on public.source_versions for select to authenticated using(public.can_read_source(organization_id,source_id));
alter table public.document_chunks enable row level security;
create policy chunks_read on public.document_chunks for select to authenticated using(public.can_read_source(organization_id,source_id));
alter table public.conversations enable row level security;
create policy conversations_read on public.conversations for select to authenticated using(public.has_role(organization_id) and user_id=auth.uid());
alter table public.messages enable row level security;
create policy messages_read on public.messages for select to authenticated using(public.has_role(organization_id) and exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=auth.uid()));
alter table public.monthly_usage enable row level security;
create policy usage_read on public.monthly_usage for select to authenticated using(public.has_role(organization_id));
alter table public.audit_logs enable row level security;
create policy audit_read on public.audit_logs for select to authenticated using(public.has_role(organization_id,array['owner','admin']::public.member_role[]));
alter table public.feedback enable row level security;
create policy feedback_read on public.feedback for select to authenticated using(user_id=auth.uid() and public.has_role(organization_id));
create policy feedback_write on public.feedback for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.messages m where m.id=message_id and m.organization_id=feedback.organization_id and m.role='assistant'));
create policy feedback_update on public.feedback for update to authenticated using(user_id=auth.uid() and public.has_role(organization_id)) with check(user_id=auth.uid() and exists(select 1 from public.messages m where m.id=message_id and m.organization_id=feedback.organization_id and m.role='assistant'));
create function public.create_organization(org_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 perform 1 from auth.users where id=auth.uid() for update;
 if (select count(*) from public.organization_members where user_id=auth.uid())>=10 then raise exception 'Limite de organizações atingido'; end if;
 insert into public.organizations(name) values(trim(org_name)) returning id into org;
 insert into public.organization_members values(org,auth.uid(),'owner',now());
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'organization.created',org);
 return org;
end $$;
create function public.save_agent(org uuid, agent_name text, agent_description text default '', agent_instructions text default '', agent uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare lim integer; result uuid;
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 select p.agent_limit into lim from public.organizations o join public.plans p on p.id=o.plan_id where o.id=org for update of o;
 if agent is null then
 if (select count(*) from public.agents where organization_id=org)>=lim then raise exception 'Limite de agentes atingido'; end if;
 insert into public.agents(organization_id,name,description,instructions) values(org,trim(agent_name),agent_description,agent_instructions) returning id into result;
 else
 update public.agents set name=trim(agent_name),description=agent_description,instructions=agent_instructions where id=agent and organization_id=org returning id into result;
 if result is null then raise exception 'Agente não encontrado'; end if;
 end if;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'agent.saved',result);
 return result;
end $$;
create function public.ingest_source(org uuid, source_title text, source_kind text, source_url text, hash text, pages integer, chars integer, chunks jsonb, source uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare lim integer; total integer; result uuid; ver integer; indexed_chars integer; highest_page integer;
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 if jsonb_typeof(chunks)<>'array' or jsonb_array_length(chunks) not between 1 and 2000 or pages not between 1 and 5000 or chars not between 1 and 2000000 then raise exception 'Conteúdo inválido'; end if;
 select coalesce(sum(length(c->>'content')),0),coalesce(max((c->>'page')::integer),1) into indexed_chars,highest_page from jsonb_array_elements(chunks) c;
 if indexed_chars not between 1 and 2500000 or highest_page not between 1 and 5000 then raise exception 'Conteúdo inválido'; end if;
 -- Quotas derive from persisted content, never a caller-provided footprint.
 pages:=greatest(1,ceil(indexed_chars/3000.0)::integer,case when source_kind='pdf' then highest_page else 1 end);
 chars:=indexed_chars;
 select p.page_limit into lim from public.organizations o join public.plans p on p.id=o.plan_id where o.id=org for update of o;
 if source is not null and not exists(select 1 from public.knowledge_sources where id=source and organization_id=org) then raise exception 'Fonte não encontrada'; end if;
 select coalesce(sum(page_count),0) into total from public.knowledge_sources where organization_id=org and (source is null or id<>source);
 if total+pages>lim then raise exception 'Limite de páginas atingido'; end if;
 if source is null then
 insert into public.knowledge_sources(organization_id,title,kind,origin_url,content_hash,page_count,char_count)
 values(org,source_title,source_kind,source_url,hash,pages,chars) returning id,version into result,ver;
 else
 update public.knowledge_sources set title=source_title,kind=source_kind,origin_url=source_url,content_hash=hash,page_count=pages,char_count=chars,version=version+1,updated_at=now()
 where id=source and organization_id=org returning id,version into result,ver;
 delete from public.document_chunks where source_id=result and organization_id=org;
 end if;
 insert into public.source_versions(organization_id,source_id,version,content_hash,page_count) values(org,result,ver,hash,pages);
 insert into public.document_chunks(organization_id,source_id,position,page,content,embedding,embedding_model)
 select org,result,(c.ordinality-1)::integer,(c.value->>'page')::integer,c.value->>'content',
 (c.value->>'embedding')::extensions.vector,c.value->>'embedding_model' from jsonb_array_elements(chunks) with ordinality c;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'source.indexed',result);
 return result;
end $$;
create function public.delete_source(org uuid, source uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 delete from public.knowledge_sources where id=source and organization_id=org;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'source.deleted',source);
end $$;
create function public.search_knowledge(org uuid, query text, query_embedding extensions.vector(1536) default null, model_name text default null)
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
create function public.reserve_question(org uuid, agent uuid, question text, conversation uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare lim integer; used integer; conv uuid; msg uuid; user_msg uuid; period date:=date_trunc('month',now())::date;
begin
 if not public.has_role(org) then raise exception 'Sem permissão'; end if;
 if length(trim(question)) not between 2 and 2000 then raise exception 'Pergunta inválida'; end if;
 if not exists(select 1 from public.agents where id=agent and organization_id=org) then raise exception 'Agente não encontrado'; end if;
 select p.response_limit into lim from public.organizations o join public.plans p on p.id=o.plan_id where o.id=org for update of o;
 if (select count(*) from public.messages where organization_id=org and role='user' and created_at>now()-interval '1 minute')>=20 then raise exception 'Muitas perguntas. Aguarde um minuto.'; end if;
 insert into public.monthly_usage(organization_id,month) values(org,period) on conflict do nothing;
 select responses into used from public.monthly_usage where organization_id=org and month=period for update;
 if used>=lim then raise exception 'Limite mensal de respostas atingido'; end if;
 if conversation is null then
 insert into public.conversations(organization_id,agent_id,user_id,title) values(org,agent,auth.uid(),left(question,100)) returning id into conv;
 else
 select id into conv from public.conversations where id=conversation and organization_id=org and user_id=auth.uid() and agent_id=agent;
 if conv is null then raise exception 'Conversa não encontrada'; end if;
 end if;
 update public.monthly_usage set responses=responses+1 where organization_id=org and month=period;
 insert into public.messages(organization_id,conversation_id,role,content) values(org,conv,'user',question) returning id into user_msg;
 insert into public.messages(organization_id,conversation_id,role,content,status,reply_to) values(org,conv,'assistant','','pending',user_msg) returning id into msg;
 return jsonb_build_object('conversation_id',conv,'message_id',msg);
end $$;
create function public.finish_answer(message uuid, answer text, answer_mode text, refs jsonb, in_tokens integer default 0, out_tokens integer default 0, model_name text default null, cost numeric default null, elapsed integer default null, failed boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 select m.organization_id into org from public.messages m join public.conversations c on c.id=m.conversation_id
 where m.id=message and c.user_id=auth.uid() and public.has_role(m.organization_id) and m.role='assistant' and m.status='pending' for update of m;
 if org is null then raise exception 'Mensagem indisponível'; end if;
 if jsonb_typeof(refs)<>'array' or jsonb_array_length(refs)>8 then raise exception 'Citações inválidas'; end if;
 if exists(select 1 from jsonb_array_elements(refs) r where not public.can_read_source(org,(r->>'source_id')::uuid)) then raise exception 'Fonte sem permissão'; end if;
 if exists(select 1 from jsonb_array_elements(refs) r where not exists(select 1 from public.document_chunks c join public.knowledge_sources s on s.id=c.source_id where c.id=(r->>'chunk_id')::uuid and c.organization_id=org and c.source_id=(r->>'source_id')::uuid and c.content=r->>'quote' and s.title=r->>'title' and s.version=(r->>'version')::integer and c.page is not distinct from (r->>'page')::integer and (r->>'number')::integer between 1 and 8)) then raise exception 'Citações não correspondem aos trechos indexados'; end if;
 update public.messages set content=left(answer,20000),mode=answer_mode,citations=refs,input_tokens=greatest(in_tokens,0),output_tokens=greatest(out_tokens,0),model=model_name,cost_usd=cost,latency_ms=elapsed,status=case when failed then 'failed' else 'complete' end where id=message;
end $$;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
