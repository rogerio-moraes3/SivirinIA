begin;
set local search_path=public,extensions;
insert into auth.users(id,email,email_confirmed_at) values
('10000000-0000-0000-0000-000000000001','owner-a@example.test',now()),
('10000000-0000-0000-0000-000000000002','owner-b@example.test',now()),
('10000000-0000-0000-0000-000000000003','viewer@example.test',now()),
('10000000-0000-0000-0000-000000000004','invited@example.test',now());
insert into public.organizations(id,name) values ('20000000-0000-0000-0000-000000000001','Empresa A'),('20000000-0000-0000-0000-000000000002','Empresa B');
insert into public.organization_members(organization_id,user_id,role) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','owner'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','owner'),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','viewer');
insert into public.agents(id,organization_id,name) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Agente A'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Agente B');
insert into public.knowledge_sources(id,organization_id,title,kind,content_hash,page_count,char_count) values
('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Reembolso A','text','a',1,100),
('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Segredo B','text','b',1,100);
insert into public.document_chunks(id,organization_id,source_id,position,content,page) values
('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',0,'O prazo de reembolso é de sete dias.',1),
('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002',0,'O segredo de reembolso da empresa B.',1);
insert into public.monthly_usage(organization_id,month,responses) values ('20000000-0000-0000-0000-000000000001',date_trunc('month',now())::date,49);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_eq((select count(*)::int from public.organizations),1,'RLS: usuário A enxerga somente organização A');
select pg_temp.assert_eq((select count(*)::int from public.knowledge_sources),1,'RLS: fontes de B são invisíveis');
select pg_temp.assert_eq((select count(*)::int from public.knowledge_source_health),1,'View de inteligência respeita RLS da fonte');
select pg_temp.assert_eq((select count(*)::int from public.document_chunks),1,'RLS: fragmentos de B são invisíveis');
select pg_temp.assert_eq((select count(*)::int from public.organization_members),2,'RLS: membros de B são invisíveis');
select pg_temp.assert_eq((select count(*)::int from public.search_knowledge('20000000-0000-0000-0000-000000000002','reembolso')),0,'Busca não retorna dados de B');
select pg_temp.assert_eq((select count(*)::int from public.search_knowledge('20000000-0000-0000-0000-000000000001','reembolso')),1,'Busca encontra fonte da própria organização');
select pg_temp.assert_throws($$select public.save_agent('20000000-0000-0000-0000-000000000002','Intruso')$$,'P0001','Sem permissão','RPC impede criação de agente em B');
select pg_temp.assert_throws($$select public.delete_source('20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002')$$,'P0001','Sem permissão','RPC impede exclusão em B');
select pg_temp.assert_throws($$select public.rename_organization('20000000-0000-0000-0000-000000000002','Invadida')$$,'P0001','Sem permissão','RPC impede renomear B');
select pg_temp.assert_throws($$select public.reserve_question('20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','reembolso')$$,'P0001','Sem permissão','RPC impede consulta em B');
select pg_temp.assert_throws($$select public.ingest_source('20000000-0000-0000-0000-000000000002','Intruso','text',null,'h',1,10,'[{"content":"ataque","page":1}]')$$,'P0001','Sem permissão','RPC impede ingestão em B');
select pg_temp.assert_throws($$update public.organizations set plan_id='business' where id='20000000-0000-0000-0000-000000000001'$$,'42501',null,'Não é possível elevar o próprio plano');
select pg_temp.assert_throws($$insert into public.organization_members(organization_id,user_id,role) values('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','owner')$$,'42501',null,'Não é possível criar associação diretamente');
select pg_temp.assert_throws($$delete from public.document_chunks$$,'42501',null,'Escrita direta nos fragmentos é negada');
select pg_temp.assert_throws($$select public.save_agent('20000000-0000-0000-0000-000000000001','Segundo agente')$$,'P0001','Limite de agentes atingido','Cota de agentes aplicada no banco');
select pg_temp.assert_throws($$select public.ingest_source('20000000-0000-0000-0000-000000000001','Enorme','text',null,'novo',1,1,(select jsonb_agg(jsonb_build_object('content',repeat('x',3000),'page',1)) from generate_series(1,50)))$$,'P0001','Limite de páginas atingido','Cota de páginas aplicada no banco');
select pg_temp.assert_lives($$select public.configure_agent_sources('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',false,array[]::uuid[])$$,'Restringe agente a seleção vazia');
select pg_temp.assert_eq((select count(*)::int from public.search_agent_knowledge('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','reembolso')),0,'Agente sem fontes permitidas não pesquisa a base inteira');
select pg_temp.assert_throws($$select public.configure_agent_sources('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',false,array['40000000-0000-0000-0000-000000000002']::uuid[])$$,'P0001','Fonte sem permissão','Agente não pode vincular fonte de outra empresa');
select pg_temp.assert_lives($$select public.configure_agent_sources('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',false,array['40000000-0000-0000-0000-000000000001']::uuid[])$$,'Vincula fonte autorizada ao agente');
select pg_temp.assert_eq((select count(*)::int from public.search_agent_knowledge('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','reembolso')),1,'Agente recupera fonte vinculada');
select set_config('test.reservation',public.reserve_question('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Qual o prazo de reembolso?')::text,true);
select pg_temp.assert_eq((select responses from public.monthly_usage where organization_id='20000000-0000-0000-0000-000000000001'),50,'Consulta reserva última unidade disponível');
select pg_temp.assert_throws($$select public.reserve_question('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Outra pergunta')$$,'P0001','Limite mensal de respostas atingido','Cota mensal bloqueia tentativa extra');
select pg_temp.assert_throws($$select public.finish_answer((current_setting('test.reservation')::jsonb->>'message_id')::uuid,'Vazamento','extractive','[{"source_id":"40000000-0000-0000-0000-000000000002"}]')$$,'P0001','Fonte sem permissão','Não aceita citação de outra empresa');
select pg_temp.assert_throws($$select public.finish_answer((current_setting('test.reservation')::jsonb->>'message_id')::uuid,'Inventada','extractive','[{"source_id":"40000000-0000-0000-0000-000000000001","chunk_id":"50000000-0000-0000-0000-000000000001","quote":"trecho inventado","title":"Reembolso A","version":1,"page":1,"number":1}]')$$,'P0001','Citações não correspondem aos trechos indexados','Banco rejeita trecho inventado mesmo com fonte permitida');
select pg_temp.assert_lives($$select public.finish_answer((current_setting('test.reservation')::jsonb->>'message_id')::uuid,'Sete dias [1]','extractive','[{"source_id":"40000000-0000-0000-0000-000000000001","quote":"O prazo de reembolso é de sete dias.","chunk_id":"50000000-0000-0000-0000-000000000001","number":1,"title":"Reembolso A","version":1,"page":1}]')$$,'Resposta da própria empresa é salva');
select pg_temp.assert_throws($$select public.finish_answer((current_setting('test.reservation')::jsonb->>'message_id')::uuid,'Alterada','extractive','[]')$$,'P0001','Mensagem indisponível','Resposta finalizada não é sobrescrita');
select set_config('test.job',public.reserve_ingestion('20000000-0000-0000-0000-000000000001',repeat('c',64),1)::text,true);
select pg_temp.assert_throws($$select public.reserve_ingestion('20000000-0000-0000-0000-000000000001',repeat('d',64),1)$$,'P0001','Documento já está em processamento. Aguarde a conclusão.','Ingestão concorrente é serializada');
select pg_temp.assert_lives($$select public.finish_ingestion(current_setting('test.job')::uuid,false)$$,'Libera reserva após falha');
select set_config('test.invite',public.invite_member('20000000-0000-0000-0000-000000000001','invited@example.test','editor'),true);
select pg_temp.assert_eq(length(current_setting('test.invite')),64,'Convite usa token aleatório de 256 bits');
select pg_temp.assert_throws($$select token_hash from public.invitations$$,'42501',null,'Hashes de convite não são expostos pelo REST');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select pg_temp.assert_throws($$select public.save_agent('20000000-0000-0000-0000-000000000001','Agente do viewer')$$,'P0001','Sem permissão','Viewer não administra agentes');
select pg_temp.assert_throws($$select public.invite_member('20000000-0000-0000-0000-000000000001','other@example.test','admin')$$,'P0001','Sem permissão','Viewer não convida administradores');
select pg_temp.assert_eq((select count(*)::int from public.conversations),0,'Membro da mesma empresa não lê conversa privada do proprietário');
select pg_temp.assert_throws($$select public.accept_invitation(current_setting('test.invite'))$$,'P0001','Convite inválido, expirado ou destinado a outro e-mail','Convite não pode ser usado por e-mail diferente');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
select pg_temp.assert_lives($$select public.accept_invitation(current_setting('test.invite'))$$,'Pessoa com e-mail confirmado aceita convite');
select pg_temp.assert_eq((select role::text from public.organization_members where user_id=auth.uid()),'editor','Convite concede somente o perfil definido');
select pg_temp.assert_throws($$select public.accept_invitation(current_setting('test.invite'))$$,'P0001','Convite inválido, expirado ou destinado a outro e-mail','Convite é de uso único');
select pg_temp.assert_throws($$select public.change_member_role('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','admin')$$,'P0001','Sem permissão','Editor não eleva seu próprio papel');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_lives($$select public.set_source_roles('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',array['editor']::public.member_role[])$$,'Administração altera ACL da fonte');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select pg_temp.assert_eq((select count(*)::int from public.knowledge_sources),0,'Viewer não lê fonte restrita a editores');
select pg_temp.assert_eq((select count(*)::int from public.search_knowledge('20000000-0000-0000-0000-000000000001','reembolso')),0,'Busca não retorna fonte fora da ACL');
select pg_temp.assert_throws($$select public.set_source_roles('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',array['viewer']::public.member_role[])$$,'P0001','Sem permissão','Viewer não amplia ACL');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_lives($$select public.delete_source('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001')$$,'Proprietário exclui sua fonte');
select pg_temp.assert_eq((select count(*)::int from public.document_chunks),0,'Excluir fonte remove fragmentos por cascata');
select pg_temp.assert_eq((select citations::text from public.messages where role='assistant'),'[]','Excluir fonte remove citações persistidas');
select pg_temp.assert_alike((select content from public.messages where role='assistant'),'%excluída%','Excluir fonte remove resposta derivada');
select pg_temp.assert_throws($$select public.delete_organization('20000000-0000-0000-0000-000000000002','Empresa B')$$,'P0001','Sem permissão','Não exclui organização alheia');
select pg_temp.assert_throws($$select public.delete_organization('20000000-0000-0000-0000-000000000001','Nome incorreto')$$,'P0001','Nome da organização inválido para confirmar exclusão','Exclusão exige nome exato');
select set_config('test.deleted_org',public.create_organization('Espaço descartável')::text,true);
select pg_temp.assert_lives($$select public.delete_organization(current_setting('test.deleted_org')::uuid,'Espaço descartável')$$,'Proprietário exclui espaço após confirmação exata');
select pg_temp.assert_eq((select count(*)::int from public.organizations where id=current_setting('test.deleted_org')::uuid),0,'Organização excluída não permanece visível');
set local role anon;
select pg_temp.assert_throws($$select public.create_organization('Anônima')$$,'42501',null,'Anônimo não executa funções de escrita');
select 'ASSERTIONS='||count(*) from pg_temp.test_assertions;
rollback;
