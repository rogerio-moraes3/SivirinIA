# Banco

Migrations em `supabase/migrations`; testes SQL em `supabase/tests`.

Tabelas implementadas: plans, organizations, organization_members, agents, knowledge_sources, source_versions, document_chunks, conversations, messages, monthly_usage, audit_logs, feedback, invitations, ingestion_jobs, agent_sources, agent_publications, publication_sources e public_queries. View knowledge_source_health usa security_invoker e mantém a RLS das fontes.

O usuário de conta é `auth.users`. Todas as tabelas empresariais têm RLS. Chaves compostas organization_id/id impedem associação de fonte/agente/conversa de empresas diferentes. As tabelas de negócio não têm escrita direta concedida a authenticated; RPCs conferem perfil e locks. Feedback tem política específica vinculada a mensagem visível. Tokens de convite são armazenados somente como SHA-256, a coluna não é concedida ao cliente.

Reserva de consultas bloqueia linha de organização e consumo mensal antes de qualquer chamada ao modelo. Tentativas aceitas consomem cota inclusive falhas; sem estorno automático. Limite adicional: 20 perguntas/minuto por organização. Mês de consumo: UTC.

Reserva de ingestão: uma em execução por organização, no máximo cinco admissões/minuto, expiração de 10 minutos. Ainda não é uma fila com worker; processamento é síncrono. O tamanho indexado e a cota de páginas são recalculados no banco a partir dos fragmentos, impedindo confiar no tamanho alegado pelo cliente. Ainda faltam quotas financeiras, de armazenamento e de tokens.

Planos têm valores comerciais propostos, sem checkout ativo. O usuário não pode alterar plan_id diretamente. Recorrência, assinaturas, pagamentos, faturas e white label ainda não possuem tabelas operacionais.

Use `db:migrate` para instalar mudanças preservando dados. `db:reset` é destrutivo na instância local. Não aplicar reset em ambiente compartilhado/produção.

PostgreSQL local 15: a imagem completa de PG17 excedeu o disco de 32 GB. Apenas banco, Auth, API, gateway e caixa de e-mail local são necessários. Studio, Storage, Realtime e demais serviços opcionais ficam excluídos. SQL e testes não dependem desses serviços.

Scripts/db-test.mjs usa psql no PostgreSQL real e helpers SECURITY INVOKER de asserção, mantendo o papel/claims sob teste. As suítes executam em transações revertidas; não há banco simulado. O schema sivirinia_internal armazena os hashes de migrations e não é exposto pelo PostgREST.

Migrations 0091/010/011 adicionam schema privado, document_tasks, document_snapshots e document_inputs interno; plano inclui storage_limit_bytes. Fila diferente de ingestion_jobs (reserva legada de URL). Execução usa papel sivirinia_worker, sem permissões diretas em tabelas. RPCs privadas não são expostas pelo PostgREST. Conclusão é transacional e revalida ACL, versão esperada, quota e lease.

Migrations 012/013/014: normalização de perguntas, funções de recuperação e índices incrementais. Comparação de vetores não depende do search_path; texto/página alterados invalidam o vetor antigo. Versões anteriores da migration foram preservadas e correções são incrementais, sem reset.

Migrations 015/017: opt-in de OCR, propagação ao worker e reprocessamento explícito do original autorizado. Migration 016: billing_intents/billing_events com RLS de owner/admin e função interna de reconciliação sandbox; não altera plano comercial. Todas foram aplicadas incrementalmente e verificadas em inicialização limpa.
