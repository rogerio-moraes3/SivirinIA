# Progresso real — SivirinIA

## Implementado e testado localmente

- Next.js/TypeScript/React/Tailwind; site comercial e painel responsivo em português.
- Cadastro, login, recuperação, sessões HttpOnly, organizações, cinco perfis, convites, RLS, isolamento, auditoria e cotas transacionais.
- Agentes, fontes permitidas, perguntas citadas, histórico privado, feedback, publicação por opt-in, widget em segunda origem e revogação.
- PDF/DOCX/texto/Markdown/CSV/HTML e PNG/JPEG por OCR: fila durável, worker restrito, parser separado, leases, retentativas, cancelamento, originais privados, snapshots integrais e download com ACL.
- OCR opcional local em português: PDF digitalizado/misto, imagens raster e imagens referenciadas em DOCX. Modelo oficial com hash fixado; limites de páginas, tempo, memória e dimensões; limpeza do grupo de processos e temporários. Veja OCR.md.
- Reprocessamento OCR do mesmo original autorizado, sem enfraquecer a duplicação para importações comuns. Atualizações preservam IDs/vetores de trechos inalterados na mesma posição/página.
- Busca textual e vetorial/híbrida com pgvector, validação de referências, normalização de perguntas e escopo do agente. Teste SQL usa vetores de fixture, sem alegar embeddings de fornecedor real.
- Geração/embeddings: adaptadores com ativação explícita, tarifas obrigatórias, limites de entrada/saída e estimativa conservadora de custo antes de chamar o provedor. Indexação valida orçamento de todos os lotes antes da primeira chamada. Não há chamada paga realizada.
- Possíveis divergências numéricas de prazos são sinalizadas com as fontes, sem escolher uma regra nem chamar o modelo. Heurística estreita; não é detecção semântica geral de contradições.
- Inteligência do histórico privado, relatórios PDF/CSV por período, indicadores observados e limites explícitos.

## Implementado parcialmente / aguardando validação externa

- Crawler BFS, sitemaps/índices, hashes e diferenças por página, CLI e relatórios de falha. Não indica remoções após varredura incompleta. **Ainda não conectado à fila/painel nem a um agendador.** Importação positiva pública bloqueada pelo DNS da nuvem; CRAWLER.md.
- Cobrança sandbox: intenções, ledger idempotente, isolamento, reconciliador restrito, painel de registros de teste, verificador de assinatura e leitura de pagamentos Mercado Pago preparados. **Checkout, recorrência e receptor de webhook não estão conectados.** Veja BILLING.md.
- OpenAI real: falta credencial/modelo autorizado, tarifas atuais e autorização de custos. AI_ENABLED permanece false; contratos simulados não são homologação de LLM.

## Evidências desta continuação

107 testes unitários em 14 arquivos, 168 asserções SQL e avaliação documental sintética 20/20 aprovados. Sete jornadas E2E passaram juntas na aplicação compilada, incluindo PDF digitalizado, reprocessamento do mesmo original e painel financeiro vazio real. Lint, TypeScript, build e inicialização limpa com migrations atuais passaram. Auditoria de dependências de produção: zero vulnerabilidades reportadas. Detalhes em TESTING.md.

Nenhum deploy público, serviço pago ou cobrança real ativado. O produto ainda não está pronto para produção. CI remoto não verificado: a consulta GitHub Actions recebeu HTTP 403.

## Bloqueios externos

- DNS nativo: EAI_AGAIN. Tentativa DoH segura e documentação oficial Mercado Pago: HTTP 403. Não remover pinning, TLS, proteção SSRF ou validar pagamentos por notificações não reconciliadas.
- Credenciais/modelos/orçamento para teste real de IA e conta de teste Mercado Pago não configurados. Não pedir segredos em chat.
- Arquivo binário da logo oficial ausente no checkout/anexos baixáveis; monograma é provisório.

## Ainda não implementado / concluído

- Backend de objetos escalável, OCR adversarial amplo, reconstrução semântica de tabelas, embeddings no worker, retenção e backup/restore operacional.
- Reranking, reformulação contextual da recuperação, contradições gerais e medição financeira completa de embeddings/infraestrutura.
- Sincronização de websites operacional/agendada; checkout/assinaturas/upgrades/cancelamentos no PSP e fiscal.
- Conectores brasileiros/internacionais, API comercial com chaves/escopos, ações/automações, WhatsApp, SSO, white label, parceiros e painel do operador.
- Revisão independente de segurança/LGPD, proteção de abuso na borda, pentest/carga e documentos jurídicos finais.

## Retomada exata

1. Usar este checkout existente; preservar .local/runtime.env, .local/worker.env e o volume. npm run db:start; npm run env:local; npm run ocr:install se o cache não existir.
2. Manter npm run worker e uma única instância npm run dev em processos próprios. npm run ready verifica serviços; não substitui E2E.
3. Próximo trabalho independente: integrar o núcleo do crawler à fila durável, fontes/versionamento e agendamento; somente aplicar remoções após coleta completa do mesmo escopo. Nesta rede, testar contratos/banco e manter validação pública bloqueada honestamente.
4. Billing: conectar checkout e recepção durável de notificações ao domínio sandbox após conferir documentação e configurar conta de teste por canal seguro. Não conceder plano real por pagamento sandbox.
5. IA: npm run ai:check sem rede; npm run eval:rag é gratuito/documental. Modo --provider exige autorização explícita e configuração segura; ainda não foi executado.
6. Commits preservam o histórico desde 21c2cd5 e são sincronizados com origin/main sem force push. Configuração reutilizável da nuvem foi atualizada para OCR/worker e limites de IA; não houve publicação de snapshot nem restauração em tarefa nova.

## 2026-10-20 — prioridade homologação (base bc4270f preservada)

Preparados `vercel.json` (deploy Git automático desligado, preflight obrigatório), exemplos separados em `deploy/`, worker Docker persistente sem root/portas e com limites, base Node fixada e modelo OCR verificado. Conexão remota do worker exige papel restrito, referência de testes, porta de sessão e TLS/certificado/hostname válidos. Migrations remotas têm comando manual com confirmação de alvo, hashes, lock e transações, sem reset/bootstrap local. Não executadas em Supabase gerenciado.

Frontend: limite de upload 3 MiB em Vercel/staging, indicação de OCR remoto configurável (não heartbeat), banner de testes, callbacks com APP_URL canônica. Transporte de IA bloqueado em staging mesmo com flag ligada. Migration 018 cria lista privada de e-mails e hook Before User Created opcional; só restringe cadastros quando habilitado no Auth de testes. Nenhum dado de produção ou segredo versionado.

Validações: 123 unitários, 174 asserções SQL, lint, TypeScript, build pelo runner E2E, sete jornadas Playwright e cold-start passaram localmente. Os 16 testes novos de homologação também passaram após revisão. Nenhuma chamada paga. Checklist de autorização/configuração e aceite remoto em STAGING.md.

Não há URL pública confirmada, vinculação Vercel ou credenciais de projeto Supabase de testes neste ambiente. Não houve deploy/criação de serviço. Para continuar: obter recursos de testes e autorização de publicação, aplicar migrations/configurar hook/SMTP/callbacks, iniciar worker e só então executar aceite remoto e fornecer o endereço real. Não anunciar integrações futuras como prontas. Conectores/WhatsApp/white label/enterprise ainda pendentes; crawler/billing preservam limitações anteriores.

Imagem do worker construída e validada: PDF textual e digitalizado em container sem root/rede, filesystem somente leitura e limites reais; conexão ao banco local com papel restrito em execução `--once` passou. Readiness local passou após restaurar Next dev e worker.
