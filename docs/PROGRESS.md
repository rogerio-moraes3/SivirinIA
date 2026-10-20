# Progresso real — SivirinIA

## Implementado e testado localmente

- Fundação Next.js/React/TypeScript/Tailwind; site comercial e painel responsivo em português.
- Cadastro/login/logout, sessões HttpOnly, recuperação por e-mail local e callback com origem validada.
- Organizações, múltiplos espaços, cinco perfis, convites por código/e-mail, alteração de perfil, renomeação e exclusão de organização mediante confirmação do proprietário.
- Migrations, RLS, vínculos de tenant, autorização, cotas transacionais, auditoria e revogação de evidência após exclusão/restrição de fonte.
- Agentes, edição/exclusão, fontes permitidas; perguntas privadas com histórico, referências, feedback e recusa sem evidência.
- PDF/DOCX/TXT/Markdown/CSV/HTML: extração, páginas de PDF, hash, fragmentos e busca textual em português. PDF e texto têm jornada E2E; DOCX real e demais extratores têm testes unitários.
- Atualização de fonte e versões de metadados, ACL por perfil e remoção de índices. Novos arquivos/textos usam originais privados em PostgreSQL, snapshots integrais por versão e download autorizado. Importações anteriores e URL síncrona continuam somente com metadados.
- Compartilhamento e widget Shadow DOM/iframe, fontes públicas selecionadas, confirmação explícita, token de 256 bits, rotação e revogação; teste em segunda origem HTTP real.
- Consumo mensal, cotas de agentes/páginas, catálogo de planos sem cobrança.
- Relatórios determinísticos do histórico privado: frequência por texto normalizado, ausência de evidência/falhas, fontes citadas/sem uso, tokens/custo conhecido, atenção por idade e exportação CSV implementada.

## Implementado, com bloqueio de validação real

- Embeddings e geração citada OpenAI: adaptador, controle de ativação, tokens, preço configurável, timeout, lotes e validação de referências. Contratos testados com simulador. **Bloqueado por credencial/modelo e autorização de custos.** IA desligada por padrão.
- URL HTTPS: crawler com proteção SSRF e robots.txt; validações e rejeição de rede privada testadas. **Importação positiva bloqueada pelo DNS nativo EAI_AGAIN da nuvem.** Não remover a proteção para contornar isso.
- Identidade: nome oficial centralizado e paleta baseada na referência. **Arquivo binário original da logo não está disponível no checkout/anexos baixáveis.** Monograma atual é provisório, sem alegação de ser a logo enviada.

## Evidências

79 testes unitários, 136 asserções SQL reais e 6 jornadas E2E foram aprovadas (cinco na execução geral, sexta em reexecução focada após correção de seletores de teste). A reinstalação com lockfile, o reinício de processos e a inicialização limpa em stack/volume isolados também passaram. Lint, TypeScript e build passaram. Detalhes e limites em TESTING.md. Nenhuma funcionalidade está declarada pronta para produção. Nenhum serviço pago ou deploy público ativado.

## Ainda não iniciado/concluído

- OCR, crawler de sites/sitemaps, sincronização agendada, armazenamento de objetos escalável e embeddings no worker. Fila/worker e snapshots completos para novos arquivos/textos implementados.
- Avaliação com provedor real e corpus empresarial, reranking, contradições, reformulação contextual da recuperação, resumos e medição financeira completa dos embeddings. Avaliação extrativa sintética de 12 casos passou; contrato de perguntas anteriores para geração foi implementado.
- Pagamentos, assinaturas operacionais, webhooks reconciliados, upgrade/downgrade e emissão fiscal. Catálogo e quotas não equivalem a billing implementado.
- API pública com chaves/escopos/OpenAPI; feedback e histórico do chat público; personalização avançada e canais.
- Conectores internacionais/brasileiros, ferramentas/automações/MCP, WhatsApp, voz, SSO, white label, parceiros e painel do operador.
- Retenção automatizada, exclusão da conta Auth, operação de backup/restore, proteção financeira/abuso completa, revisão independente de segurança/LGPD e documentos jurídicos finais.

## Ponto exato de retomada

1. Ler README, AGENTS, BLOCKERS e TESTING; usar este checkout existente.
2. Iniciar o runtime mínimo com npm run db:start; preservar .local/runtime.env e o volume. Aplicação com npm run dev em uma única instância, ou npm start após build.
3. Para testar geração real, obter credencial/modelos autorizados em configuração segura, autorização explícita de gastos e avaliar perguntas/citações. Não pedir segredo em chat nem ativar IA silenciosamente.
4. Originais/fila implementados: executar npm run worker em processo próprio. Próximo trabalho: OCR opcional e evolução do crawler/sincronização segura; depois billing/conectores. Avaliação documental, escopo de agentes, manutenção incremental de trechos e exportação PDF por período já implementados.
5. Commits locais enviados a origin/main sem force push. Consulta de GitHub Actions bloqueada por HTTP 403; CI remoto não verificado. Nenhuma publicação de site/snapshot nem restauração em tarefa nova.

## Etapa de ingestão assíncrona validada

Fila durável com lease de 120 s, exclusão mútua por organização, backoff, três tentativas, cancelamento e recuperação após abandono. Parser separado: heap V8 de 512 MB, prazo de 60 s, limite de entrada/saída, sem credenciais herdadas. O limite de 192 MB foi insuficiente para o PDF real e foi corrigido. Papel de worker dedicado sem leitura direta de tabelas nem service_role. Limite de armazenamento por plano (100 MiB inicial), até 20 versões. Bytes e conteúdo histórico privado protegidos pela ACL atual. Não é isolamento de sistema operacional nem armazenamento de objetos ilimitado; veja DOCUMENT_PIPELINE.md.

## Evoluções seguintes desta sessão

- Recuperação corrigida: chat usa search_agent_knowledge com o agente da conversa, em vez de busca geral da organização. Perguntas naturais passam por normalização lexical explícita. Avaliação real de PostgreSQL em corpus sintético: 12/12, antes 8/12; sem provedor externo.
- Atualizações preservam IDs/vetores dos fragmentos inalterados na mesma posição/página; alterados/removidos são substituídos/excluídos. Dez asserções SQL específicas passaram. Ainda não há alinhamento de trechos deslocados nem geração de embeddings no worker.
- Inteligência ganhou filtro de datas de São Paulo, CSV com o mesmo período e PDF privado real, com perguntas, fontes, lacunas e consumo observado. Mantém o limite e escopo do histórico privado; fontes/revisão refletem o estado atual.
- Fundação, fila e etapas validadas preservadas em commits; sincronização autorizada com origin/main sem force push. A consulta de CI remoto recebeu HTTP 403; não afirmar que CI passou.

Próximo módulo executável: OCR opcional em português no worker com rasterização e limites de páginas/tempo; tesseract/pdftoppm existem, mas dados do idioma português ainda não estão instalados. Manter OCR explicitamente indisponível até implementar e testar. Depois, aprofundar crawler sem enfraquecer SSRF e evoluir billing conforme ROADMAP.
