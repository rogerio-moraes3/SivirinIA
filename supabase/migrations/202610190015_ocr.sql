alter table public.document_tasks add column ocr_requested boolean not null default false;
grant select(ocr_requested) on public.document_tasks to authenticated;
alter table public.knowledge_sources drop constraint knowledge_sources_kind_check;
alter table public.knowledge_sources add constraint knowledge_sources_kind_check check(kind in ('text','pdf','docx','url','markdown','csv','html','image'));
create function public.enqueue_document_with_ocr(org uuid, source_title text, filename text, input_mode text, input_base64 text, ocr_requested boolean, source uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare task uuid;
begin
 if ocr_requested and (input_mode<>'file' or lower(filename) !~ '\.(pdf|docx|png|jpg|jpeg)$') then raise exception 'Documento não suporta OCR'; end if;
 task:=public.enqueue_document(org,source_title,filename,input_mode,input_base64,source,null);
 update public.document_tasks set ocr_requested=coalesce(enqueue_document_with_ocr.ocr_requested,false) where id=task;
 return task;
end $$;
revoke execute on function public.enqueue_document_with_ocr(uuid,text,text,text,text,boolean,uuid) from public,anon;
grant execute on function public.enqueue_document_with_ocr(uuid,text,text,text,text,boolean,uuid) to authenticated;

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
 return jsonb_build_object('id',task.id,'token',task.lease_token,'filename',task.filename,'mode',task.input_mode,'ocr',task.ocr_requested,'url',task.origin_url,
 'base64',(select encode(original,'base64') from sivirinia_internal.document_inputs where task_id=task.id));
end $$;

create or replace function sivirinia_internal.fail_document(task_id uuid, token uuid, code text, retryable boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if code not in ('invalid_document','network_unavailable','worker_timeout','quota_exceeded','duplicate','access_revoked','version_conflict','internal_error','ocr_unavailable','ocr_failed','ocr_no_text','ocr_page_limit','ocr_image_limit','ocr_required') then code:='internal_error'; end if;
 update public.document_tasks set status=case when retryable and attempts<3 then 'retry' else 'failed' end,
 available_at=now()+make_interval(secs=>least(300,5*power(2,attempts)::integer)),error_code=code,lease_token=null,lease_until=null,finished_at=case when retryable and attempts<3 then null else now() end
 where id=task_id and lease_token=token and status='processing' and lease_until>=now();
end $$;
