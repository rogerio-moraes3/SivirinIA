# Roadmap integral

A especificação completa está em PRD.md. Progresso verificável em PROGRESS.md.

0. Fundação: Next/TS, Auth, organizações, RLS, perfis, convites, testes e CI.
1. Núcleo: PDF/DOCX/texto/URL, fragmentos, busca, embeddings opcionais, respostas e citações, versões, reindexação, ingestão assíncrona, OCR opcional e avaliações em português.
2. SaaS: agentes configuráveis, fontes por agente, publicação pública com escopo restrito, widget Shadow DOM, conversas, onboarding, cotas, Mercado Pago reconciliado, planos e site comercial.
3. Inteligência: perguntas frequentes/não respondidas, agrupamento, lacunas, contradições, obsolescência, tendências, qualidade e exportação CSV/PDF.
4. Conectores: Google Drive/Docs, Notion, SharePoint/OneDrive, Confluence, GitHub, Zendesk e brasileiros Movidesk/Omie/Bling/Conta Azul/RD/Tiny/Hotmart/Kiwify. Priorizar piloto com acesso real, APIs oficiais e sincronização incremental.
5. Ações: registro de ferramentas, credenciais protegidas, permissões por agente, limites, aprovação, idempotência, logs, CRM/ERP/tickets/agendamento e MCP com escopo.
6. Enterprise: WhatsApp oficial, voz, SSO, retenção, monitoramento e operação administrativa auditada.
7. Distribuição e escala: white label, revenda, contas parceiras, domínio customizado, comissões, otimização e API pública versionada.

Cada módulo exige validação funcional e de isolamento antes de ser anunciado. Não avançar sobre falha crítica de segurança não corrigida. Não confundir os critérios comerciais dos PDFs com permissões de gastos ou publicação.

Concluído nesta etapa: fila durável e parser separado, originais privados, snapshots integrais para novos arquivos/textos e download com ACL. Embeddings no worker e sincronização agendada ainda pendentes. OCR opcional em português implementado conforme OCR.md.

Também implementados: avaliação documental sintética em português, correção do escopo do agente, manutenção incremental por posição/página e relatórios PDF/CSV por período. Continuam pendentes avaliação de LLM real, OCR, semântica avançada e billing operacional.

Continuação atual: OCR em português e reprocessamento entregues; avaliação documental ampliada, orçamentos pré-chamada e heurística de divergências. Crawler BFS/sitemap/diff implementado no núcleo/CLI; integração à fila/painel/agendador pendente. Ledger sandbox e contratos Mercado Pago preparados; checkout/recorrência/webhook receptor continuam pendentes.

Prioridade vigente: homologação segura de acordo com STAGING.md. Preparação de Vercel/Supabase separado/worker persistente implementada; recursos remotos, autorização de publicação e aceite no domínio real ainda pendentes. Testes locais não encerram esta fase. Depois do aceite, retomar sincronização de sites em fila, embeddings no worker e billing operacional, com custos sempre sujeitos a autorização.
