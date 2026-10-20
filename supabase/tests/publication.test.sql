begin;
set local search_path=public,extensions;
insert into auth.users(id,email,email_confirmed_at) values
('11000000-0000-0000-0000-000000000001','publisher@example.test',now()),
('11000000-0000-0000-0000-000000000002','other@example.test',now());
insert into public.organizations(id,name) values
('22000000-0000-0000-0000-000000000001','Publicadora'),('22000000-0000-0000-0000-000000000002','Outra empresa');
insert into public.organization_members(organization_id,user_id,role) values
('22000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','owner'),
('22000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000002','owner');
insert into public.agents(id,organization_id,name,instructions) values
('33000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Assistente público','Preferência interna não publicada');
insert into public.knowledge_sources(id,organization_id,title,kind,content_hash,page_count,char_count) values
('44000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Política pública','text','public',1,100),
('44000000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000001','Documento interno','text','private',1,100),
('44000000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000002','Documento de outra empresa','text','other',1,100);
insert into public.document_chunks(organization_id,source_id,position,content) values
('22000000-0000-0000-0000-000000000001','44000000-0000-0000-0000-000000000001',0,'O reembolso público ocorre em sete dias.'),
('22000000-0000-0000-0000-000000000001','44000000-0000-0000-0000-000000000002',0,'O reembolso confidencial da diretoria é interno.'),
('22000000-0000-0000-0000-000000000002','44000000-0000-0000-0000-000000000003',0,'Reembolso da outra empresa: dados restritos.');
set local role authenticated;
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_throws($$select public.publish_agent('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001',array['44000000-0000-0000-0000-000000000003']::uuid[],'PUBLICAR')$$,'P0001','Fonte sem permissão','Publicação não aceita fonte de outro tenant');
select pg_temp.assert_throws($$select public.publish_agent('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001',array['44000000-0000-0000-0000-000000000001']::uuid[],'')$$,'P0001','Confirmação inválida','Publicação exige confirmação explícita');
select set_config('test.public_token',public.publish_agent('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001',array['44000000-0000-0000-0000-000000000001']::uuid[],'PUBLICAR'),true);
select pg_temp.assert_eq(length(current_setting('test.public_token')),64,'Link utiliza token de 256 bits');
select pg_temp.assert_throws($$select token_hash from public.agent_publications$$,'42501',null,'Hashes de publicação não são expostos ao cliente');
set local role anon;
select pg_temp.assert_eq(public.public_agent_info(current_setting('test.public_token'))->>'name','Assistente público','Visitante acessa nome público autorizado');
select pg_temp.assert_true(not(public.public_agent_info(current_setting('test.public_token'))?'instructions'),'Instruções internas não são retornadas publicamente');
select pg_temp.assert_eq((select count(*)::int from public.search_public_knowledge(current_setting('test.public_token'),'reembolso')),1,'Busca pública retorna somente a fonte selecionada');
select pg_temp.assert_eq((select title from public.search_public_knowledge(current_setting('test.public_token'),'reembolso')),'Política pública','Fonte interna e outro tenant não aparecem');
select pg_temp.assert_eq((select count(*)::int from public.search_public_knowledge(repeat('0',64),'reembolso')),0,'Token inválido não retorna evidência');
select pg_temp.assert_throws($$select * from public.document_chunks$$,'42501',null,'Visitante não lê tabela de fragmentos diretamente');
select pg_temp.assert_throws($$select * from public.agents$$,'42501',null,'Visitante não lê configuração privada do agente');
select pg_temp.assert_lives($$select public.reserve_public_question(current_setting('test.public_token'),'Qual o prazo de reembolso?')$$,'Consulta pública é admitida com cota');
set local role authenticated;
select pg_temp.assert_eq((select responses from public.monthly_usage where organization_id='22000000-0000-0000-0000-000000000001'),1,'Consulta pública consome a mesma franquia mensal');
reset role;
update public.monthly_usage set responses=50 where organization_id='22000000-0000-0000-0000-000000000001';
set local role anon;
select pg_temp.assert_throws($$select public.reserve_public_question(current_setting('test.public_token'),'Outra pergunta')$$,'P0001','Limite mensal de respostas atingido','Quota pública não pode exceder o plano');
set local role authenticated;
select pg_temp.assert_lives($$select public.revoke_publication('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001')$$,'Administrador revoga publicação');
set local role anon;
select pg_temp.assert_eq(public.public_agent_info(current_setting('test.public_token')),null::jsonb,'Link revogado deixa de abrir');
select pg_temp.assert_eq((select count(*)::int from public.search_public_knowledge(current_setting('test.public_token'),'reembolso')),0,'Busca revogada não retorna trechos');
select pg_temp.assert_throws($$select public.reserve_public_question(current_setting('test.public_token'),'Pergunta')$$,'P0001','Agente público indisponível','Link revogado não admite consulta');
set local role authenticated;
select set_config('test.rotated_token',public.publish_agent('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001',array['44000000-0000-0000-0000-000000000001']::uuid[],'PUBLICAR'),true);
select pg_temp.assert_ne(current_setting('test.rotated_token'),current_setting('test.public_token'),'Nova publicação rotaciona token');
select pg_temp.assert_eq(public.public_agent_info(current_setting('test.public_token')),null::jsonb,'Token antigo continua inválido após republicação');
select pg_temp.assert_lives($$select public.set_source_roles('22000000-0000-0000-0000-000000000001','44000000-0000-0000-0000-000000000001',array['editor']::public.member_role[])$$,'Altera permissão da fonte publicada');
set local role anon;
select pg_temp.assert_eq(public.public_agent_info(current_setting('test.rotated_token')),null::jsonb,'Mudança de ACL revoga publicação automaticamente');
set local role authenticated;
select set_config('test.demoted_token',public.publish_agent('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001',array['44000000-0000-0000-0000-000000000001']::uuid[],'PUBLICAR'),true);
reset role;
update public.organization_members set role='editor' where organization_id='22000000-0000-0000-0000-000000000001' and user_id='11000000-0000-0000-0000-000000000001';
set local role anon;
select pg_temp.assert_eq(public.public_agent_info(current_setting('test.demoted_token')),null::jsonb,'Remover privilégio do publicador revoga seus links');
select 'ASSERTIONS='||count(*) from pg_temp.test_assertions;
rollback;
