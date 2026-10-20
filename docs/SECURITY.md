# Segurança

Implementado: verificação de sessão no servidor; RLS; roles owner/admin/editor/analyst/viewer; locks e cotas; vínculos tenant por FK; citações validadas contra a base; convites por token aleatório de 256 bits com hash, prazo e e-mail confirmado; rotas protegidas; validação Zod; React escapa conteúdo; limites de upload; parsing de texto sem execução; cabeçalhos antiframe/nosniff/referrer; CSV neutraliza fórmulas.

SSRF: somente HTTPS/443, sem credenciais; bloqueio de redes especiais IPv4/IPv6 e IPv4 mapeado; validação de todos os IPs DNS; conexão fixada no IP validado com TLS para o hostname original; timeout, limite de bytes e redirecionamentos apenas dentro da mesma origem; robots.txt verificado de forma conservadora.

Não é proteção completa contra malware. Faltam antivírus/quarentena, isolamento de parser por processo com orçamento de CPU/memória, CSP com nonces, rate limiting por IP na borda, revisão independente, pentest, backup/restore e operações de retenção. PDFs complexos e ZIPs hostis precisam de corpus adversarial maior.

Conteúdo externo não é confiável. Prompt injection é mitigada por separação e ausência de ferramentas, não declarada resolvida. Não enviar dados sensíveis até revisão apropriada. Não declarar conformidade LGPD ou residência no Brasil sem verificar contratos e todos os fornecedores.

Nenhum operador tem painel de leitura irrestrita de documentos nesta versão. Não há service_role na aplicação. Compartilhamento público existe por opt-in do administrador, com fontes selecionadas, token rotacionável e revogação. Não houve deploy público. CSP impede incorporação das rotas privadas e permite iframe somente na rota compartilhada. Publicações exigem testes específicos de isolamento antes de uso com dados reais.

Cookies privados são HttpOnly/SameSite=Lax, Secure em execução de produção. Origem de callback é validada; hosts externos não configurados, credenciais em APP_URL e o bind 0.0.0.0 não são aceitos como destino. Segredos locais são aleatórios, gerados por CSPRNG e armazenados somente em arquivo ignorado de permissão 0600; não são chaves de fornecedor inventadas nem valores embutidos no frontend. O gateway da composição é de desenvolvimento, vinculado a loopback, sem papel administrativo na aplicação.

Originais/snapshots novos são privados em PostgreSQL, com download autenticado, ACL atual, anexo/nosniff/no-store e exclusão em cascata. Worker tem papel dedicado com execução limitada a três funções internas, sem leitura direta de tarefas/contas. Parser em processo filho não herda credenciais. Limites de heap/prazo não equivalem a sandbox de SO. PDFs exportados contêm somente o histórico privado autorizado e limites explícitos; não há relatório de leitura irrestrita das conversas de colegas.

Extensões: OCR nativo tem limites prlimit/CPU/timeout e grupo de processos com limpeza de temporários, sem credenciais herdadas. Importação HTTPS agora limita espera de DNS e duração absoluta da requisição. Financeiro sandbox é isolado por RLS; reconciliador sem leitura ampla e eventos idempotentes não mudam plano real. Verificador de assinatura Mercado Pago é um contrato preparado, não um endpoint de recebimento homologado.
