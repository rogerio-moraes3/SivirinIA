-- Incremental index maintenance; unchanged chunks retain identifiers and embeddings.
create or replace function public.ingest_source(org uuid, source_title text, source_kind text, source_url text, hash text, pages integer, chars integer, chunks jsonb, source uuid default null)
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
 -- Keep only chunks unchanged at the same document position/page.
 delete from public.document_chunks old where old.source_id=result and old.organization_id=org and not exists(
 select 1 from jsonb_array_elements(chunks) with ordinality c where (c.ordinality-1)::integer=old.position
 and c.value->>'content'=old.content and (c.value->>'page')::integer is not distinct from old.page);
 end if;
 insert into public.source_versions(organization_id,source_id,version,content_hash,page_count) values(org,result,ver,hash,pages);
 insert into public.document_chunks(organization_id,source_id,position,page,content,embedding,embedding_model)
 select org,result,(c.ordinality-1)::integer,(c.value->>'page')::integer,c.value->>'content',
 (c.value->>'embedding')::extensions.vector,c.value->>'embedding_model' from jsonb_array_elements(chunks) with ordinality c
 on conflict(source_id,position) do update set content=excluded.content,page=excluded.page,
 embedding=excluded.embedding,embedding_model=excluded.embedding_model
 where public.document_chunks.content is distinct from excluded.content
 or public.document_chunks.page is distinct from excluded.page
 or (excluded.embedding is not null and (public.document_chunks.embedding_model is distinct from excluded.embedding_model or public.document_chunks.embedding is distinct from excluded.embedding));
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'source.indexed',result);
 return result;
end $$;
