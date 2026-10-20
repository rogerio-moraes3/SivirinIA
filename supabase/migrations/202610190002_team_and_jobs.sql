create table public.invitations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 email text not null check(length(email)<=254), role public.member_role not null check(role<>'owner'),
 token_hash text not null unique, expires_at timestamptz not null default now()+interval '7 days',
 accepted_at timestamptz, created_at timestamptz not null default now(), created_by uuid references auth.users on delete set null
);
alter table public.invitations enable row level security;
revoke all on public.invitations from anon,authenticated;
grant select(id,organization_id,email,role,expires_at,accepted_at,created_at,created_by) on public.invitations to authenticated;
create policy invitations_admin on public.invitations for select to authenticated using(public.has_role(organization_id,array['owner','admin']::public.member_role[]));
create function public.invite_member(org uuid, member_email text, member_role public.member_role) returns text
language plpgsql security definer set search_path='' as $$
declare token text:=encode(extensions.gen_random_bytes(32),'hex');
begin
 if not public.has_role(org,array['owner','admin']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 if member_role='owner' or (member_role='admin' and not public.has_role(org,array['owner']::public.member_role[])) then raise exception 'Sem permissão para conceder este perfil'; end if;
 if member_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'E-mail inválido'; end if;
 perform 1 from public.organizations where id=org for update;
 if (select count(*) from public.invitations where organization_id=org and accepted_at is null and expires_at>now())>=100 then raise exception 'Limite de convites atingido'; end if;
 insert into public.invitations(organization_id,email,role,token_hash,created_by) values(org,lower(trim(member_email)),member_role,encode(extensions.digest(token,'sha256'),'hex'),auth.uid());
 insert into public.audit_logs(organization_id,user_id,action) values(org,auth.uid(),'member.invited');
 return token;
end $$;
create function public.accept_invitation(invite_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.invitations; user_email text;
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 select lower(email) into user_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into invitation from public.invitations where token_hash=encode(extensions.digest(invite_token,'sha256'),'hex') and accepted_at is null and expires_at>now() for update;
 if invitation.id is null or user_email is null or invitation.email<>user_email then raise exception 'Convite inválido, expirado ou destinado a outro e-mail'; end if;
 insert into public.organization_members(organization_id,user_id,role) values(invitation.organization_id,auth.uid(),invitation.role) on conflict do nothing;
 update public.invitations set accepted_at=now() where id=invitation.id;
 insert into public.audit_logs(organization_id,user_id,action) values(invitation.organization_id,auth.uid(),'member.joined');
 return invitation.organization_id;
end $$;
create function public.change_member_role(org uuid, member uuid, new_role public.member_role) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 if member=auth.uid() or new_role='owner' then raise exception 'Alteração de proprietário não permitida por este fluxo'; end if;
 update public.organization_members set role=new_role where organization_id=org and user_id=member and role<>'owner';
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'member.role_changed',member);
end $$;
create function public.rename_organization(org uuid, new_name text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_role(org,array['owner','admin']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 update public.organizations set name=trim(new_name) where id=org;
 insert into public.audit_logs(organization_id,user_id,action) values(org,auth.uid(),'organization.renamed');
end $$;
create table public.ingestion_jobs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 user_id uuid not null references auth.users on delete cascade, content_hash text not null, reserved_pages integer not null check(reserved_pages>0),
 status text not null default 'processing' check(status in ('processing','complete','failed')),
 created_at timestamptz not null default now(), finished_at timestamptz
);
alter table public.ingestion_jobs enable row level security;
revoke all on public.ingestion_jobs from anon,authenticated;
grant select on public.ingestion_jobs to authenticated;
create policy jobs_read on public.ingestion_jobs for select to authenticated using(public.has_role(organization_id,array['owner','admin','editor']::public.member_role[]));
create function public.reserve_ingestion(org uuid, hash text, pages integer) returns uuid language plpgsql security definer set search_path='' as $$
declare lim integer; total integer; job uuid;
begin
 if not public.has_role(org,array['owner','admin','editor']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 if pages not between 1 and 5000 or length(hash)<>64 then raise exception 'Documento inválido'; end if;
 select p.page_limit into lim from public.organizations o join public.plans p on p.id=o.plan_id where o.id=org for update of o;
 update public.ingestion_jobs set status='failed',finished_at=now() where organization_id=org and status='processing' and created_at<now()-interval '10 minutes';
 if (select count(*) from public.ingestion_jobs where organization_id=org and created_at>now()-interval '1 minute')>=5 then raise exception 'Limite de importações por minuto atingido'; end if;
 if exists(select 1 from public.ingestion_jobs where organization_id=org and status='processing') then raise exception 'Documento já está em processamento. Aguarde a conclusão.'; end if;
 if exists(select 1 from public.knowledge_sources where organization_id=org and content_hash=hash) then raise exception 'Documento duplicado'; end if;
 select coalesce(sum(page_count),0) into total from public.knowledge_sources where organization_id=org;
 if total+pages>lim then raise exception 'Limite de páginas atingido'; end if;
 insert into public.ingestion_jobs(organization_id,user_id,content_hash,reserved_pages) values(org,auth.uid(),hash,pages) returning id into job;
 return job;
end $$;
create function public.finish_ingestion(job uuid, succeeded boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.ingestion_jobs set status=case when succeeded then 'complete' else 'failed' end,finished_at=now()
 where id=job and user_id=auth.uid() and public.has_role(organization_id,array['owner','admin','editor']::public.member_role[]) and status='processing';
end $$;
-- Source removal also removes stored excerpts from answers referencing the deleted source.
create function public.redact_deleted_source() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.messages set content='Uma fonte desta resposta foi excluída. Os trechos e a resposta foram removidos.',citations='[]',mode='abstention'
 where organization_id=old.organization_id and exists(select 1 from jsonb_array_elements(citations) r where r->>'source_id'=old.id::text);
 return old;
end $$;
create trigger redact_source_before_delete before delete on public.knowledge_sources for each row execute function public.redact_deleted_source();
revoke execute on function public.redact_deleted_source() from public,anon,authenticated;
revoke execute on function public.invite_member(uuid,text,public.member_role),public.accept_invitation(text),public.change_member_role(uuid,uuid,public.member_role),public.rename_organization(uuid,text),public.reserve_ingestion(uuid,text,integer),public.finish_ingestion(uuid,boolean) from public,anon;
grant execute on function public.invite_member(uuid,text,public.member_role),public.accept_invitation(text),public.change_member_role(uuid,uuid,public.member_role),public.rename_organization(uuid,text),public.reserve_ingestion(uuid,text,integer),public.finish_ingestion(uuid,boolean) to authenticated;
