begin;
insert into auth.users(id,email,email_confirmed_at) values('a1000000-0000-0000-0000-000000000001','hybrid-owner@example.test',now());
insert into public.organizations(id,name) values('a2000000-0000-0000-0000-000000000001','Hybrid teste');
insert into public.organization_members(organization_id,user_id,role) values('a2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','owner');
insert into public.agents(id,organization_id,name) values('a3000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','Hybrid agente');
insert into public.knowledge_sources(id,organization_id,title,kind,content_hash,page_count,char_count) values
('a4000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','Semântica','text','h1',1,30),
('a4000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000001','Lexical','text','h2',1,30);
insert into public.document_chunks(organization_id,source_id,position,content,embedding,embedding_model) values
('a2000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001',0,'Segundo fator é obrigatório.',('[1,'||repeat('0,',1534)||'0]')::extensions.vector,'fixture-only'),
('a2000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000002',0,'O reembolso ocorre em sete dias.',('[0,1,'||repeat('0,',1533)||'0]')::extensions.vector,'fixture-only');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_eq((select count(*)::int from public.search_agent_knowledge('a2000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001','astronomia',('[1,'||repeat('0,',1534)||'0]')::extensions.vector,'fixture-only')),1,'Busca vetorial real recupera sem correspondência lexical');
select pg_temp.assert_eq((select count(*)::int from public.search_agent_knowledge('a2000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001','reembolso',('[1,'||repeat('0,',1534)||'0]')::extensions.vector,'fixture-only')),2,'Busca híbrida inclui evidência lexical e semântica');
select pg_temp.assert_eq((select count(*)::int from public.search_agent_knowledge('a2000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001','astronomia',('[1,'||repeat('0,',1534)||'0]')::extensions.vector,'outro-modelo')),0,'Embedding de modelo incompatível não gera evidência');
select public.configure_agent_sources('a2000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001',false,array['a4000000-0000-0000-0000-000000000002']::uuid[]);
select pg_temp.assert_eq((select count(*)::int from public.search_agent_knowledge('a2000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001','astronomia',('[1,'||repeat('0,',1534)||'0]')::extensions.vector,'fixture-only')),0,'Similaridade não atravessa whitelist do agente');
select 'ASSERTIONS='||count(*) from pg_temp.test_assertions;
rollback;
