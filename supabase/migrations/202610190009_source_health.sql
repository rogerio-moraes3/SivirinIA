create view public.knowledge_source_health with (security_invoker=true) as
select id,organization_id,title,updated_at,updated_at<now()-interval '90 days' as needs_review
from public.knowledge_sources;
revoke all on public.knowledge_source_health from anon;
grant select on public.knowledge_source_health to authenticated;
