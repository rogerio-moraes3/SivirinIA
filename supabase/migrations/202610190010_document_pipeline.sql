-- Private durable inputs and complete version snapshots. No object has a public URL.
-- A bounded PostgreSQL bytea backend avoids introducing a paid object storage service.
alter table public.plans add column storage_limit_bytes bigint not null default 104857600 check(storage_limit_bytes>0);
create table public.document_tasks (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 user_id uuid not null references auth.users on delete cascade,
 source_id uuid, expected_version integer, title text not null check(length(title) between 1 and 250),
 filename text not null check(length(filename) between 1 and 250), input_mode text not null check(input_mode in ('file','text','url')),
 origin_url text, byte_count integer not null check(byte_count between 1 and 10485760), input_hash text not null,
 status text not null default 'queued' check(status in ('queued','processing','retry','complete','failed','cancelled')),
 attempts integer not null default 0 check(attempts between 0 and 3), available_at timestamptz not null default now(),
 lease_token uuid, lease_until timestamptz, error_code text, created_at timestamptz not null default now(), finished_at timestamptz,
 foreign key(organization_id,source_id) references public.knowledge_sources(organization_id,id) on delete cascade
);
create index document_tasks_ready on public.document_tasks(available_at,created_at) where status in ('queued','retry','processing');
create index document_tasks_org on public.document_tasks(organization_id,created_at desc);
alter table public.document_tasks enable row level security;
revoke all on public.document_tasks from public,anon,authenticated;
grant select(id,organization_id,user_id,source_id,title,filename,input_mode,byte_count,status,attempts,error_code,created_at,finished_at,available_at) on public.document_tasks to authenticated;
create policy document_tasks_read on public.document_tasks for select to authenticated using(
 public.has_role(organization_id,array['owner','admin','editor']::public.member_role[]) and (source_id is null or public.can_read_source(organization_id,source_id))
);
create table sivirinia_internal.document_inputs (
 task_id uuid primary key references public.document_tasks on delete cascade, original bytea not null
);
create table public.document_snapshots (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, source_id uuid not null, version integer not null,
 filename text not null, input_hash text not null, original bytea not null, pages jsonb not null,
 created_at timestamptz not null default now(), unique(source_id,version),
 foreign key(organization_id,source_id) references public.knowledge_sources(organization_id,id) on delete cascade,
 foreign key(source_id,version) references public.source_versions(source_id,version) on delete cascade
);
alter table public.document_snapshots enable row level security;
revoke all on public.document_snapshots from public,anon,authenticated;
grant select(id,organization_id,source_id,version,filename,input_hash,created_at) on public.document_snapshots to authenticated;
create policy snapshots_read on public.document_snapshots for select to authenticated using(public.can_read_source(organization_id,source_id));
revoke all on sivirinia_internal.document_inputs from public,anon,authenticated;

create function public.enqueue_document(org uuid, source_title text, filename text, input_mode text, input_base64 text, source uuid default null, origin_url text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare raw bytea; digest text; result uuid; ver integer; used bigint; lim bigint;
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 if length(input_base64)>13981016 then raise exception 'Arquivo excede 10 MB'; end if;
 raw:=decode(input_base64,'base64');
 if octet_length(raw) not between 1 and 10485760 then raise exception 'Arquivo inválido'; end if;
 if input_mode not in ('file','text','url') or length(filename) not between 1 and 250 or length(trim(source_title)) not between 1 and 250 then raise exception 'Documento inválido'; end if;
 if input_mode='url' and (origin_url is null or length(origin_url)>2048) then raise exception 'URL inválida'; end if;
 select p.storage_limit_bytes into lim from public.organizations o join public.plans p on p.id=o.plan_id where o.id=org for update of o;
 if source is not null then
  if not public.can_read_source(org,source) then raise exception 'Fonte sem permissão'; end if;
  select version into ver from public.knowledge_sources where id=source and organization_id=org;
 end if;
 if (select count(*) from public.document_tasks where organization_id=org and created_at>now()-interval '1 minute')>=5 then raise exception 'Limite de importações por minuto atingido'; end if;
 if (select count(*) from public.document_tasks where organization_id=org and status in ('queued','processing','retry'))>=10 then raise exception 'Limite de tarefas pendentes atingido'; end if;
 digest:=encode(extensions.digest(raw,'sha256'),'hex');
 if exists(select 1 from public.document_tasks t where t.organization_id=org and t.input_hash=digest and t.source_id is not distinct from source and t.status in ('queued','processing','retry'))
 or exists(select 1 from public.document_snapshots s where s.organization_id=org and s.input_hash=digest and s.source_id is not distinct from source)
 then raise exception 'Documento duplicado'; end if;
 select coalesce((select sum(octet_length(s.original)) from public.document_snapshots s where s.organization_id=org),0)+
 coalesce((select sum(octet_length(i.original)) from sivirinia_internal.document_inputs i join public.document_tasks t on t.id=i.task_id where t.organization_id=org),0) into used;
 if used+octet_length(raw)>lim then raise exception 'Limite de armazenamento privado atingido'; end if;
 insert into public.document_tasks(organization_id,user_id,source_id,expected_version,title,filename,input_mode,origin_url,byte_count,input_hash)
 values(org,auth.uid(),source,ver,trim(source_title),filename,input_mode,origin_url,octet_length(raw),digest) returning id into result;
 insert into sivirinia_internal.document_inputs values(result,raw);
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'document.queued',result);
 return result;
end $$;
create function public.get_document_original(org uuid, source uuid, revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.can_read_source(org,source) then raise exception 'Sem permissão'; end if;
 select jsonb_build_object('filename',filename,'base64',encode(original,'base64'),'sha256',input_hash) into result
 from public.document_snapshots where organization_id=org and source_id=source and version=revision;
 return result;
end $$;
create function public.get_document_version(org uuid, source uuid, revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.can_read_source(org,source) then raise exception 'Sem permissão'; end if;
 return (select pages from public.document_snapshots where organization_id=org and source_id=source and version=revision);
end $$;
create function public.cancel_document_task(org uuid, task uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 -- Cancelling invalidates a running worker's lease; the worker cannot commit afterwards.
 update public.document_tasks set status='cancelled',lease_until=null,lease_token=null,finished_at=now()
 where organization_id=org and id=task and status in ('queued','retry','processing','failed') and (source_id is null or public.can_read_source(org,source_id));
 if found then
  delete from sivirinia_internal.document_inputs where task_id=task;
  insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'document.cancelled',task);
 end if;
end $$;
create function public.retry_document_task(org uuid, task uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 -- Manual retries cannot bypass the three-attempt budget. Invalid input must be corrected and resubmitted.
 update public.document_tasks set status='queued',available_at=now(),error_code=null,finished_at=null
 where organization_id=org and id=task and status='failed' and attempts<3 and (source_id is null or public.can_read_source(org,source_id))
 and exists(select 1 from sivirinia_internal.document_inputs where task_id=task);
 if not found then raise exception 'Documento não permite nova tentativa; corrija e envie novamente'; end if;
end $$;
revoke execute on function public.enqueue_document(uuid,text,text,text,text,uuid,text),public.get_document_original(uuid,uuid,integer),public.get_document_version(uuid,uuid,integer),public.cancel_document_task(uuid,uuid),public.retry_document_task(uuid,uuid) from public,anon;
grant execute on function public.enqueue_document(uuid,text,text,text,text,uuid,text),public.get_document_original(uuid,uuid,integer),public.get_document_version(uuid,uuid,integer),public.cancel_document_task(uuid,uuid),public.retry_document_task(uuid,uuid) to authenticated;

-- No login/password is embedded in migrations. Local provisioning assigns a dedicated credential.
do $$ begin if not exists(select 1 from pg_roles where rolname='sivirinia_worker') then create role sivirinia_worker nologin noinherit; end if; end $$;
grant usage on schema sivirinia_internal to sivirinia_worker;
create function sivirinia_internal.claim_document() returns jsonb language plpgsql security definer set search_path='' as $$
declare task public.document_tasks; org uuid;
begin
 update public.document_tasks set status='failed',error_code='worker_timeout',finished_at=now(),lease_token=null,lease_until=null
 where status='processing' and lease_until<now() and attempts>=3;
 select o.id into org from public.organizations o where exists(select 1 from public.document_tasks t where t.organization_id=o.id
 and t.attempts<3 and ((t.status in ('queued','retry') and t.available_at<=now()) or (t.status='processing' and t.lease_until<now())))
 and not exists(select 1 from public.document_tasks t where t.organization_id=o.id and t.status='processing' and t.lease_until>=now())
 order by o.id for update of o skip locked limit 1;
 if org is null then return null; end if;
 select * into task from public.document_tasks t where t.organization_id=org and t.attempts<3
 and ((t.status in ('queued','retry') and t.available_at<=now()) or (t.status='processing' and t.lease_until<now())) order by t.created_at for update skip locked limit 1;
 if task.id is null then return null; end if;
 update public.document_tasks set status='processing',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '120 seconds',error_code=null
 where id=task.id returning * into task;
 return jsonb_build_object('id',task.id,'token',task.lease_token,'filename',task.filename,'mode',task.input_mode,'url',task.origin_url,
 'base64',(select encode(original,'base64') from sivirinia_internal.document_inputs where task_id=task.id));
end $$;
create function sivirinia_internal.finish_document(task_id uuid, token uuid, extracted_pages jsonb, source_kind text, chunks jsonb, hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare task public.document_tasks; result uuid; ver integer;
begin
 -- Lock order: organization, then task, consistent with cancellation/deletion/enqueue.
 select organization_id into result from public.document_tasks where id=task_id;
 perform 1 from public.organizations where id=result for update;
 select * into task from public.document_tasks where id=task_id for update;
 if task.id is null or task.lease_token is distinct from token then raise exception 'Lease inválido'; end if;
 if task.status='complete' then return task.source_id; end if;
 if task.status<>'processing' or task.lease_until<now() then raise exception 'Lease expirado'; end if;
 perform set_config('request.jwt.claim.sub',task.user_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',task.user_id,'role','authenticated')::text,true);
 if not public.has_role(task.organization_id,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 if task.source_id is not null and (not public.can_read_source(task.organization_id,task.source_id) or task.expected_version<>(select version from public.knowledge_sources where id=task.source_id)) then raise exception 'Fonte alterada ou sem permissão'; end if;
 if jsonb_typeof(extracted_pages)<>'array' or jsonb_array_length(extracted_pages) not between 1 and 5000 or octet_length(extracted_pages::text)>12000000 then raise exception 'Documento inválido'; end if;
 if exists(select 1 from public.knowledge_sources s where s.organization_id=task.organization_id and s.content_hash=hash and s.id is distinct from task.source_id) then raise exception 'Documento duplicado'; end if;
 if task.source_id is not null and exists(select 1 from public.knowledge_sources where id=task.source_id and content_hash=hash) then
  -- Identical extracted content: preserve index/version and avoid duplicate storage.
  result:=task.source_id;
 else
  if (select count(*) from public.source_versions where source_id=task.source_id)>=20 then raise exception 'Limite de 20 versões atingido'; end if;
  result:=public.ingest_source(task.organization_id,task.title,source_kind,task.origin_url,hash,1,1,chunks,task.source_id);
  select version into ver from public.knowledge_sources where id=result;
  insert into public.document_snapshots(organization_id,source_id,version,filename,input_hash,original,pages)
  select task.organization_id,result,ver,task.filename,task.input_hash,i.original,extracted_pages from sivirinia_internal.document_inputs i where i.task_id=task.id;
 end if;
 update public.document_tasks set status='complete',source_id=result,finished_at=now(),lease_until=null where id=task.id;
 delete from sivirinia_internal.document_inputs where document_inputs.task_id=task.id;
 return result;
end $$;
create function sivirinia_internal.fail_document(task_id uuid, token uuid, code text, retryable boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if code not in ('invalid_document','network_unavailable','worker_timeout','quota_exceeded','duplicate','access_revoked','version_conflict','internal_error') then code:='internal_error'; end if;
 update public.document_tasks set status=case when retryable and attempts<3 then 'retry' else 'failed' end,
 available_at=now()+make_interval(secs=>least(300,5*power(2,attempts)::integer)),error_code=code,lease_token=null,lease_until=null,finished_at=case when retryable and attempts<3 then null else now() end
 where id=task_id and lease_token=token and status='processing' and lease_until>=now();
end $$;
revoke execute on function sivirinia_internal.claim_document(),sivirinia_internal.finish_document(uuid,uuid,jsonb,text,jsonb,text),sivirinia_internal.fail_document(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function sivirinia_internal.claim_document(),sivirinia_internal.finish_document(uuid,uuid,jsonb,text,jsonb,text),sivirinia_internal.fail_document(uuid,uuid,text,boolean) to sivirinia_worker;
