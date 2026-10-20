-- Sandbox ledger only. Test payment approval NEVER changes a production entitlement.
create table public.billing_intents (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations on delete cascade,
 created_by uuid references auth.users on delete set null, plan_id text not null references public.plans,
 amount_cents integer not null check(amount_cents>0),currency text not null default 'BRL' check(currency='BRL'),
 environment text not null default 'sandbox' check(environment='sandbox'),
 status text not null default 'created' check(status in ('created','pending','in_process','approved','rejected','cancelled','refunded','charged_back')),
 provider_payment_id text unique,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index billing_intents_org on public.billing_intents(organization_id,created_at desc);
alter table public.billing_intents enable row level security;
revoke all on public.billing_intents from public,anon,authenticated;
grant select on public.billing_intents to authenticated;
create policy billing_admin_read on public.billing_intents for select to authenticated using(public.has_role(organization_id,array['owner','admin']::public.member_role[]));
create table public.billing_events (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations on delete cascade,
 intent_id uuid not null references public.billing_intents on delete cascade,event_key text not null unique check(length(event_key) between 1 and 200),
 provider_payment_id text not null,amount_cents integer not null,currency text not null,status text not null,
 applied boolean not null,created_at timestamptz not null default now()
);
create index billing_events_org on public.billing_events(organization_id,created_at desc);
alter table public.billing_events enable row level security;
revoke all on public.billing_events from public,anon,authenticated;
grant select on public.billing_events to authenticated;
create policy billing_events_admin on public.billing_events for select to authenticated using(public.has_role(organization_id,array['owner','admin']::public.member_role[]));
create function public.create_sandbox_billing_intent(org uuid,target_plan text) returns uuid language plpgsql security definer set search_path='' as $$
declare amount integer;result uuid;
begin
 if not public.has_role(org,array['owner']::public.member_role[]) then raise exception 'Sem permissão'; end if;
 perform 1 from public.organizations where id=org for update;
 select monthly_cents into amount from public.plans where id=target_plan and monthly_cents>0;
 if amount is null then raise exception 'Plano inválido'; end if;
 if (select count(*) from public.billing_intents where organization_id=org and created_at>now()-interval '1 minute')>=5 then raise exception 'Limite de solicitações financeiras atingido'; end if;
 insert into public.billing_intents(organization_id,created_by,plan_id,amount_cents) values(org,auth.uid(),target_plan,amount) returning id into result;
 insert into public.audit_logs(organization_id,user_id,action,entity_id) values(org,auth.uid(),'billing.sandbox_intent_created',result);
 return result;
end $$;
revoke execute on function public.create_sandbox_billing_intent(uuid,text) from public,anon;
grant execute on function public.create_sandbox_billing_intent(uuid,text) to authenticated;
do $$ begin if not exists(select 1 from pg_roles where rolname='sivirinia_billing_reconciler') then create role sivirinia_billing_reconciler nologin noinherit; end if; end $$;
grant usage on schema sivirinia_internal to sivirinia_billing_reconciler;
create function sivirinia_internal.apply_sandbox_payment(intent uuid,event_key text,payment_id text,amount integer,currency text,payment_status text) returns boolean language plpgsql security definer set search_path='' as $$
declare record public.billing_intents; previous public.billing_events;apply boolean;
begin
 select * into record from public.billing_intents where id=intent for update;
 if record.id is null then raise exception 'Referência financeira inválida'; end if;
 if amount<>record.amount_cents or currency<>record.currency or payment_id !~ '^[0-9]{1,20}$' then raise exception 'Valor ou referência financeira incompatível'; end if;
 if record.provider_payment_id is not null and record.provider_payment_id<>payment_id then raise exception 'Pagamento incompatível com a intenção'; end if;
 if payment_status not in ('pending','in_process','approved','rejected','cancelled','refunded','charged_back') then raise exception 'Estado financeiro inválido'; end if;
 select * into previous from public.billing_events e where e.event_key=apply_sandbox_payment.event_key;
 if previous.id is not null then
  if previous.intent_id<>intent or previous.provider_payment_id<>payment_id or previous.amount_cents<>amount or previous.currency<>currency or previous.status<>payment_status then raise exception 'Evento duplicado incompatível'; end if;
  return false;
 end if;
 apply:=not(record.status in ('refunded','charged_back') or (record.status='approved' and payment_status not in ('refunded','charged_back')));
 insert into public.billing_events(organization_id,intent_id,event_key,provider_payment_id,amount_cents,currency,status,applied)
 values(record.organization_id,intent,event_key,payment_id,amount,currency,payment_status,apply);
 if apply then update public.billing_intents set status=payment_status,provider_payment_id=payment_id,updated_at=now() where id=intent; end if;
 -- Sandbox events do not alter organizations.plan_id, monthly_usage or real subscription state.
 return apply;
end $$;
revoke execute on function sivirinia_internal.apply_sandbox_payment(uuid,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function sivirinia_internal.apply_sandbox_payment(uuid,text,text,integer,text,text) to sivirinia_billing_reconciler;
