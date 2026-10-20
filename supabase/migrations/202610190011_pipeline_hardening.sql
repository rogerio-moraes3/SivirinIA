-- Correct duplicate detection after tasks have acquired a source identifier.
create or replace function public.enqueue_document(org uuid, source_title text, filename text, input_mode text, input_base64 text, source uuid default null, origin_url text default null)
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
 or exists(select 1 from public.document_snapshots s where s.organization_id=org and s.input_hash=digest and (source is null or s.source_id=source))
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
-- Lock organization before tasks, including abandoned-lease recovery, to avoid lock inversion.
create or replace function sivirinia_internal.claim_document() returns jsonb language plpgsql security definer set search_path='' as $$
declare task public.document_tasks; org uuid;
begin
 select o.id into org from public.organizations o where exists(select 1 from public.document_tasks t where t.organization_id=o.id
 and ((t.status in ('queued','retry') and t.available_at<=now() and t.attempts<3) or (t.status='processing' and t.lease_until<now())))
 and not exists(select 1 from public.document_tasks t where t.organization_id=o.id and t.status='processing' and t.lease_until>=now())
 order by (select min(t.created_at) from public.document_tasks t where t.organization_id=o.id and t.status in ('queued','retry','processing'))
 for update of o skip locked limit 1;
 if org is null then return null; end if;
 update public.document_tasks set status='failed',error_code='worker_timeout',finished_at=now(),lease_token=null,lease_until=null
 where organization_id=org and status='processing' and lease_until<now() and attempts>=3;
 select * into task from public.document_tasks t where t.organization_id=org and t.attempts<3
 and ((t.status in ('queued','retry') and t.available_at<=now()) or (t.status='processing' and t.lease_until<now())) order by t.created_at for update skip locked limit 1;
 if task.id is null then return null; end if;
 update public.document_tasks set status='processing',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '120 seconds',error_code=null
 where id=task.id returning * into task;
 return jsonb_build_object('id',task.id,'token',task.lease_token,'filename',task.filename,'mode',task.input_mode,'url',task.origin_url,
 'base64',(select encode(original,'base64') from sivirinia_internal.document_inputs where task_id=task.id));
end $$;
