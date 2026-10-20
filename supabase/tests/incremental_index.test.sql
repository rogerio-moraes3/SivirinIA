begin;
insert into auth.users(id,email,email_confirmed_at) values('81000000-0000-0000-0000-000000000001','incremental@example.test',now());
insert into public.organizations(id,name) values('82000000-0000-0000-0000-000000000001','Incremental de teste');
insert into public.organization_members(organization_id,user_id,role) values('82000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','owner');
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
select set_config('test.source',public.ingest_source('82000000-0000-0000-0000-000000000001','Manual','pdf',null,repeat('a',64),2,100,
 jsonb_build_array(jsonb_build_object('content','O reembolso ocorre em sete dias.','page',1,'embedding',to_jsonb(array_fill(0.1,array[1536])),'embedding_model','fixture-only'),jsonb_build_object('content','Contato antigo de suporte.','page',2,'embedding',to_jsonb(array_fill(0.2,array[1536])),'embedding_model','fixture-only')))::text,true);
select set_config('test.kept',(select id::text from public.document_chunks where source_id=current_setting('test.source')::uuid and position=0),true);
select set_config('test.changed',(select id::text from public.document_chunks where source_id=current_setting('test.source')::uuid and position=1),true);
select public.ingest_source('82000000-0000-0000-0000-000000000001','Manual atualizado','pdf',null,repeat('b',64),2,100,
 '[{"content":"O reembolso ocorre em sete dias.","page":1},{"content":"Novo contato de suporte.","page":2}]',current_setting('test.source')::uuid);
select pg_temp.assert_eq((select id::text from public.document_chunks where source_id=current_setting('test.source')::uuid and position=0),current_setting('test.kept'),'Fragmento inalterado preserva ID');
select pg_temp.assert_eq((select embedding_model from public.document_chunks where id=current_setting('test.kept')::uuid),'fixture-only','Fragmento inalterado preserva modelo do embedding');
select pg_temp.assert_true((select embedding is not null from public.document_chunks where id=current_setting('test.kept')::uuid),'Fragmento inalterado preserva vetor real persistido');
select pg_temp.assert_ne((select id::text from public.document_chunks where source_id=current_setting('test.source')::uuid and position=1),current_setting('test.changed'),'Fragmento alterado recebe nova identidade');
select pg_temp.assert_true((select embedding is null from public.document_chunks where source_id=current_setting('test.source')::uuid and position=1),'Texto alterado não reutiliza embedding obsoleto');
select pg_temp.assert_eq((select count(*)::int from public.document_chunks where source_id=current_setting('test.source')::uuid),2,'Atualização não duplica fragmentos');
select pg_temp.assert_eq((select version from public.knowledge_sources where id=current_setting('test.source')::uuid),2,'Atualização mantém versionamento da fonte');
select pg_temp.assert_eq((select count(*)::int from public.source_versions where source_id=current_setting('test.source')::uuid),2,'Metadados de ambas versões são preservados');
select public.ingest_source('82000000-0000-0000-0000-000000000001','Manual curto','pdf',null,repeat('c',64),1,100,
 '[{"content":"O reembolso ocorre em sete dias.","page":1}]',current_setting('test.source')::uuid);
select pg_temp.assert_eq((select count(*)::int from public.document_chunks where source_id=current_setting('test.source')::uuid),1,'Página removida desaparece da busca');
select pg_temp.assert_eq((select id::text from public.document_chunks where source_id=current_setting('test.source')::uuid),current_setting('test.kept'),'Remover página preserva fragmento restante');
select 'ASSERTIONS='||count(*) from pg_temp.test_assertions;
rollback;
