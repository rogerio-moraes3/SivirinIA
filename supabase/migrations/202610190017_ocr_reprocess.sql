-- Explicit OCR reprocessing may reuse the original of an authorized existing source.
create function sivirinia_internal.enqueue_ocr_reprocess(org uuid, source_title text, filename text, input_mode text, input_base64 text, source uuid default null, origin_url text default null)
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
 or exists(select 1 from public.document_snapshots s where s.organization_id=org and s.input_hash=digest and source is null)
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
revoke execute on function sivirinia_internal.enqueue_ocr_reprocess(uuid,text,text,text,text,uuid,text) from public,anon,authenticated;
create or replace function public.enqueue_document_with_ocr(org uuid, source_title text, filename text, input_mode text, input_base64 text, ocr_requested boolean, source uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare task uuid;
begin
 if ocr_requested and (input_mode<>'file' or lower(filename) !~ '\.(pdf|docx|png|jpg|jpeg)$') then raise exception 'Documento não suporta OCR'; end if;
 if ocr_requested and source is not null then
  task:=sivirinia_internal.enqueue_ocr_reprocess(org,source_title,filename,input_mode,input_base64,source,null);
 else task:=public.enqueue_document(org,source_title,filename,input_mode,input_base64,source,null); end if;
 update public.document_tasks set ocr_requested=coalesce(enqueue_document_with_ocr.ocr_requested,false) where id=task;
 return task;
end $$;
