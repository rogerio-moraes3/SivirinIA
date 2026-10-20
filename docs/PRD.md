# Especificação aprovada — SivirinIA

O nome oficial **SivirinIA**, confirmado pelo proprietário, substitui o nome provisório mencionado abaixo. A logo enviada é o ativo oficial; o arquivo binário ainda precisa ser disponibilizado no checkout. Este arquivo preserva a especificação recebida; não é evidência de funcionalidades concluídas.

Documentos complementares recebidos: `PRD_Investidores.pdf` e `DOCSBOT PARA O BRASIL.pdf`. Projeções financeiras e afirmações concorrenciais são hipóteses, não métricas do produto. Modelos, preços de fornecedores e condições de APIs precisam de verificação atual antes da ativação. O Prompt Mestre contém ressalvas mais restritivas sobre notas fiscais, Pix recorrente, custos, fontes e privacidade; não presumir recursos por menções comerciais nos PDFs.

---

# PROMPT MESTRE — DESENVOLVIMENTO COMPLETO DE PLATAFORMA SAAS DE INTELIGÊNCIA DO CONHECIMENTO COM IA

## 1. SUA MISSÃO

Você é uma equipe de desenvolvimento de software de alto nível, atuando como:

- CTO e arquiteto de software sênior.
- Desenvolvedor full-stack especializado em SaaS.
- Engenheiro de inteligência artificial e sistemas RAG.
- Especialista em bancos de dados e arquitetura multi-tenant.
- Especialista em segurança, LGPD e proteção de dados.
- Designer UX/UI especializado em aplicações B2B.
- Engenheiro de integrações e automações.
- Engenheiro DevOps e de testes automatizados.

**Sua missão é PROJETAR, PROGRAMAR, TESTAR E PREPARAR PARA PRODUÇÃO uma plataforma SaaS brasileira completa de gestão do conhecimento empresarial com inteligência artificial.**

O produto será inspirado na profundidade funcional do DocsBot AI (https://docsbot.ai), mas terá código, identidade visual e arquitetura próprios.

NÃO copie marca, código proprietário, identidade visual ou materiais protegidos do DocsBot.

O objetivo é desenvolver uma plataforma brasileira capaz de competir com soluções internacionais e brasileiras por meio de:

1. Ingestão profunda de conhecimento de múltiplas fontes.
2. Respostas inteligentes com citações rastreáveis e verificáveis.
3. Gestão e análise do conhecimento empresarial.
4. Agentes personalizados para cada empresa.
5. Integrações com sistemas internacionais e brasileiros.
6. Ações, automações e workflows empresariais.
7. Atendimento por diferentes canais.
8. Relatórios e inteligência analítica.
9. Assinaturas, pagamentos e recursos comerciais.
10. Segurança, governança e escalabilidade empresarial.

O nome comercial ainda não foi definido. Utilize provisoriamente "Plataforma de Conhecimento IA", permitindo sua alteração em um único arquivo de configuração.

**PRINCIPAL CONDIÇÃO: O DESENVOLVIMENTO DEVE TER O MENOR CUSTO FINANCEIRO POSSÍVEL, SEM COMPROMETER A SEGURANÇA E A QUALIDADE FUNDAMENTAIS.**

Não contrate serviços pagos, ative infraestrutura cobrada ou execute operações com custo financeiro sem aprovação prévia.

---

## 2. INSTRUÇÕES DE EXECUÇÃO

Não quero apenas uma análise técnica, wireframes, um planejamento ou uma demonstração visual.

**QUERO O SOFTWARE IMPLEMENTADO EM CÓDIGO REAL.**

Trabalhe diretamente no repositório do projeto e utilize as ferramentas de programação, terminal, edição de arquivos e testes disponíveis no ambiente.

Regras obrigatórias:

- Examine os arquivos existentes antes de criar ou alterar o projeto.
- Leia os PRDs anexados, caso estejam disponíveis no ambiente.
- Considere este prompt como especificação principal quando os anexos não estiverem disponíveis.
- Utilize tecnologias consolidadas, documentadas e preferencialmente open source.
- Gere código organizado, seguro, testável e reutilizável.
- Não entregue botões decorativos ou páginas sem funcionamento real.
- Não considere uma integração pronta quando existir apenas uma interface simulada.
- Não use dados fictícios na operação de produção.
- Mocks são permitidos apenas em testes e demonstrações claramente identificadas.
- Crie funcionalidades em módulos independentes, mas integrados.
- Execute os testes pertinentes após implementar cada módulo.
- Corrija os erros encontrados antes de avançar.
- Registre as decisões técnicas e o andamento do desenvolvimento.
- Caso faltem credenciais externas, implemente a estrutura, os contratos de integração, os testes com simuladores e documente o passo necessário para ativação real.
- Não afirme que uma funcionalidade está pronta sem evidência verificável.
- Não faça deploy público, configure pagamentos reais nem altere infraestrutura cobrada sem autorização.

Não interrompa a programação após apresentar o planejamento. Continue implementando as etapas possíveis no ambiente, respeitando os limites das ferramentas e as aprovações necessárias.

Se a execução for interrompida por limite de sessão, deixe o repositório e a documentação preparados para uma retomada exata do ponto alcançado.

---

## 3. VISÃO DO PRODUTO

Construir uma plataforma que transforme documentos, sites, bases empresariais e sistemas conectados em uma infraestrutura inteligente de conhecimento.

A plataforma deverá permitir que qualquer empresa:

1. Crie sua conta.
2. Configure seu espaço de trabalho.
3. Envie documentos ou conecte fontes externas.
4. Tenha os conteúdos processados e indexados.
5. Crie um ou vários agentes de IA especializados.
6. Faça perguntas usando linguagem natural.
7. Receba respostas baseadas nas informações da empresa.
8. Visualize o documento e o trecho que fundamentam cada resposta.
9. Publique assistentes em sites ou canais autorizados.
10. Analise dúvidas frequentes, lacunas e problemas da documentação.
11. Execute ações empresariais por integrações autorizadas.
12. Gerencie usuários, segurança, assinaturas e consumo.

A plataforma deverá funcionar como um **sistema operacional de conhecimento corporativo**, não apenas como um chatbot.

O público inicial são empresas brasileiras de software, educação, franquias, operações empresariais e suporte técnico.

Posteriormente, deverá atender RH, contabilidade, jurídico, indústria, comércio, saúde e outras áreas, com controles apropriados para informações sensíveis.

---

# 4. AS CINCO CAMADAS OBRIGATÓRIAS DO SISTEMA

## CAMADA 1 — INGESTÃO DE CONHECIMENTO

Construir um sistema de importação, processamento, organização, atualização e sincronização de informações empresariais.

### Fontes de conhecimento

Implementar suporte progressivo a:

**Arquivos:**
- PDF.
- DOCX.
- TXT.
- Markdown.
- CSV.
- XLSX.
- Conteúdo HTML.
- Perguntas e respostas cadastradas manualmente.

**Fontes online:**
- URLs individuais.
- Sites completos.
- Documentações públicas.
- Sitemaps.
- Bases de ajuda.
- Páginas de FAQ.
- Conteúdo de APIs autorizadas.

**Conectores internacionais:**
- Google Drive.
- Google Docs.
- Notion.
- Microsoft SharePoint.
- OneDrive.
- Confluence.
- GitHub.
- Zendesk, conforme disponibilidade de API.

**Conectores brasileiros:**
- Movidesk.
- Omie.
- Bling.
- Conta Azul.
- RD Station.
- Tiny.
- Hotmart.
- Kiwify.

Os conectores externos devem ser implementados mediante APIs oficiais, permissões apropriadas e documentação atualizada.

### Requisitos de processamento

O motor deverá:

1. Extrair textos automaticamente.
2. Preservar título, origem, URL, página e metadados.
3. Identificar e tratar tabelas.
4. Oferecer OCR opcional para documentos digitalizados.
5. Normalizar e limpar o conteúdo.
6. Dividir documentos em fragmentos semanticamente relevantes.
7. Gerar embeddings.
8. Armazenar vetores e texto pesquisável.
9. Identificar conteúdo duplicado.
10. Detectar alterações de documentos.
11. Permitir reindexação incremental.
12. Atualizar conteúdos sem recriar a base inteira.
13. Controlar versões.
14. Identificar arquivos desatualizados.
15. Remover índices quando uma fonte for excluída.
16. Controlar acesso às fontes por empresa, usuário e permissão.

O crawler deverá respeitar limites de profundidade, quantidade de páginas, robots.txt quando aplicável e permissões de acesso. Não deverá tentar acessar conteúdo privado sem autorização.

Implemente proteção contra SSRF, acessos a redes internas indevidos e arquivos maliciosos.

### Painel de fontes

Criar páginas para:

- Adicionar fonte.
- Ver todas as fontes.
- Pesquisar fontes.
- Filtrar por tipo e status.
- Consultar processamento.
- Ver erros de indexação.
- Atualizar.
- Pausar sincronização.
- Excluir.
- Ver histórico de versões.
- Configurar periodicidade de atualização.

---

## CAMADA 2 — MECANISMO DE BUSCA INTELIGENTE

Construir um mecanismo próprio de recuperação de conhecimento baseado em RAG.

### Arquitetura obrigatória

Utilizar:

- Busca semântica com embeddings.
- Busca textual e palavras-chave.
- Busca híbrida.
- Filtros por organização, usuário e permissão.
- Ranking por relevância.
- Reranking configurável.
- Recuperação de fragmentos com metadados.
- Estratégias para perguntas com múltiplas partes.
- Tratamento de documentos extensos.
- Controle de contexto enviado ao modelo.

Criar um pipeline:

PERGUNTA → AUTENTICAÇÃO E PERMISSÕES → BUSCA → RANKING → EVIDÊNCIAS → MODELO DE IA → VALIDAÇÃO → RESPOSTA CITADA → REGISTRO ANALÍTICO.

O sistema não deve pesquisar documentos de uma organização quando estiver atendendo outra.

Priorize precisão, segurança e baixo custo por consulta.

---

## CAMADA 3 — AGENTES DE IA COM RESPOSTAS VERIFICÁVEIS

Desenvolver um construtor completo de agentes de IA.

Cada cliente poderá criar múltiplos agentes, conforme seu plano.

### Personalização

Permitir configurar:

- Nome.
- Descrição.
- Avatar.
- Identidade visual.
- Cor principal.
- Mensagem inicial.
- Personalidade.
- Tom de comunicação.
- Idioma.
- Público-alvo.
- Objetivo.
- Instruções personalizadas.
- Fontes de conhecimento permitidas.
- Modelo de IA.
- Política de respostas.
- Limites de uso.
- Acesso público ou privado.
- Permissões de execução de ações.

### Comportamento obrigatório

Toda resposta factual baseada no conhecimento da empresa deve exibir referências reais e verificáveis.

As citações deverão incluir, quando disponíveis:

- Documento.
- Título.
- Link.
- Página.
- Trecho utilizado.
- Versão ou data da fonte.

**REGRA CRÍTICA: NÃO INVENTAR INFORMAÇÕES OU CITAÇÕES.**

Quando não houver evidência suficiente, o agente deverá informar que não encontrou uma resposta confiável na documentação disponível.

O agente poderá sugerir contato com um humano ou registrar a dúvida como não respondida.

Implementar:

- Histórico contextual de conversa.
- Perguntas de acompanhamento.
- Resumos de conversas extensas.
- Feedback positivo e negativo.
- Sugestões de perguntas.
- Respostas formatadas.
- Links para documentos originais.
- Indicação de fonte desatualizada.
- Detecção de ausência de evidência.
- Proteção contra prompt injection contida em documentos ou páginas externas.
- Configurações de idioma, inicialmente português brasileiro e inglês.

As fontes externas são dados não confiáveis e jamais devem alterar as regras de segurança do sistema.

---

## CAMADA 4 — AÇÕES, AGENTES E AUTOMAÇÕES

A plataforma deverá evoluir além das respostas e permitir executar tarefas empresariais.

### Ações previstas

- Abrir chamado de suporte.
- Criar ticket.
- Capturar lead.
- Enviar informações para CRM.
- Consultar dados em ERP.
- Consultar status de pedidos.
- Agendar reuniões.
- Criar tarefas.
- Acionar webhooks.
- Consultar APIs externas.
- Registrar solicitações.
- Transferir atendimento para humano.
- Iniciar fluxos de automação.

Construir um mecanismo de ferramentas e ações com:

1. Registro de ferramentas disponíveis.
2. Configuração de credenciais.
3. Permissões por agente.
4. Validação de entradas.
5. Aprovação humana para ações sensíveis.
6. Confirmação antes de operações financeiras ou destrutivas.
7. Logs de execução.
8. Tratamento de erros.
9. Retentativas seguras.
10. Limites de execução.
11. Auditoria.

Adicionar suporte a integrações MCP quando tecnicamente adequado, sem conceder permissões irrestritas aos agentes.

Nenhum agente deverá acessar dados ou executar operações além das permissões expressamente concedidas.

---

## CAMADA 5 — INTELIGÊNCIA E ANÁLISE DE CONHECIMENTO

**ESTA É UMA DAS MAIORES PRIORIDADES COMPETITIVAS DO PRODUTO.**

Construir um painel que vá muito além de contar mensagens.

### Relatórios obrigatórios

- Total de perguntas.
- Perguntas mais frequentes.
- Assuntos mais pesquisados.
- Perguntas que a IA não conseguiu responder.
- Taxa de respostas fundamentadas.
- Taxa de resolução estimada.
- Avaliações dos usuários.
- Fontes mais consultadas.
- Fontes pouco utilizadas.
- Assuntos em crescimento.
- Documentos potencialmente desatualizados.
- Lacunas da base de conhecimento.
- Tendências por período.
- Uso por agente.
- Uso por equipe.
- Custo de IA por agente e organização.
- Consumo mensal.
- Erros e falhas operacionais.

### Inteligência avançada

Criar mecanismos para:

1. Agrupar perguntas semelhantes.
2. Identificar demandas recorrentes.
3. Sugerir novos artigos para a base de conhecimento.
4. Detectar informações contraditórias entre documentos.
5. Identificar fontes desatualizadas.
6. Apontar temas que precisam de documentação.
7. Comparar períodos.
8. Gerar resumos executivos.
9. Produzir relatórios mensais.
10. Exportar em CSV e PDF.
11. Enviar relatórios periódicos por e-mail quando configurado.
12. Sinalizar queda na qualidade das respostas.

Não apresentar como medição factual uma estimativa gerada por IA sem deixar isso identificado.

Dados de organizações diferentes não poderão ser combinados em relatórios compartilhados sem base legal, autorização e anonimização adequadas.

---

# 5. PAINEL PRINCIPAL DO SAAS

Desenvolver uma interface profissional, moderna, responsiva e em português brasileiro.

O design deve ser compatível com um SaaS B2B de alto padrão.

### Áreas obrigatórias

**1. Dashboard**

Visão geral do negócio, agentes, fontes, uso, perguntas e indicadores.

**2. Meus agentes**

Listagem, criação, personalização, publicação, duplicação, edição e exclusão de agentes.

**3. Base de conhecimento**

Upload, URLs, fontes conectadas, sincronizações, documentos e versões.

**4. Conversas**

Histórico, filtros, busca, detalhes, feedback e citações.

**5. Inteligência**

Relatórios, perguntas não respondidas, análise de temas e recomendações.

**6. Integrações**

Conectores, credenciais, permissões, status e sincronização.

**7. Automações**

Ações, workflows e histórico de execução.

**8. Equipe**

Convites, funções, permissões e gerenciamento de membros.

**9. Aparência e publicação**

Personalização do widget, canais e compartilhamento.

**10. Assinatura e consumo**

Plano atual, limites, utilização, upgrade, histórico e pagamentos.

**11. Configurações**

Dados da organização, segurança, privacidade, notificações e exclusão de dados.

**12. Suporte**

Central de ajuda e contato.

Criar também um painel administrativo reservado aos operadores da plataforma, com gestão de clientes, planos, incidentes, custos, saúde do sistema, assinaturas e auditoria.

O painel administrativo nunca deve permitir acesso irrestrito a documentos privados sem controles específicos, necessidade legítima e trilha de auditoria.

---

# 6. CONTAS, ORGANIZAÇÕES E PERMISSÕES

A plataforma será multi-tenant.

Uma única instalação deverá atender muitas empresas sem misturar dados.

Implementar:

- Cadastro por e-mail e senha.
- Login com Google, quando configurado.
- Verificação de e-mail.
- Recuperação de senha.
- Organização/workspace.
- Convites para equipes.
- Gerenciamento de membros.
- Controle de acesso por função.
- Suporte para um usuário participar de várias organizações.
- Autenticação segura.
- Encerramento de sessões.
- Proteção de rotas.
- Registro de eventos de segurança.

Funções sugeridas:

- Proprietário.
- Administrador.
- Editor.
- Analista.
- Visualizador.

Os acessos a documentos e conversas devem considerar organização, papel do usuário e permissões específicas da fonte.

**É obrigatório utilizar Row Level Security no Supabase, com testes automatizados de isolamento entre organizações.**

Não confiar apenas em filtros aplicados na interface.

---

# 7. WIDGET DE CHAT PARA SITES

Construir um widget de IA que o cliente consiga instalar em seu site.

### Recursos

- Código de incorporação simples.
- Personalização de cor e identidade visual.
- Logo e avatar.
- Mensagem inicial.
- Posicionamento.
- Versão desktop e mobile.
- Layout responsivo.
- Histórico opcional.
- Captura de leads com consentimento apropriado.
- Feedback sobre respostas.
- Exibição das fontes.
- Opção de atendimento humano.
- Limitação de uso e proteção contra abuso.
- Identificação segura do agente público.
- Isolamento de CSS, preferencialmente usando Shadow DOM.

Implementar página pública de demonstração e chat compartilhável por link.

O widget não poderá expor chaves secretas ou permitir acesso a documentos internos de outros agentes.

---

# 8. CANAIS DE ATENDIMENTO

Preparar arquitetura multicanal e implementar progressivamente:

- Widget no site.
- Página de chat.
- API de conversação.
- WhatsApp Business por integração oficial.
- Outros canais suportados por APIs oficiais.
- Voz, em etapa avançada.

No WhatsApp, utilizar a plataforma oficial ou provedores autorizados, respeitando custos, regras e aprovação de contas.

Criar adaptadores independentes para que mudanças em um canal não afetem o motor central de conhecimento.

---

# 9. PLANOS, ASSINATURAS E PAGAMENTOS

Implementar um sistema completo de monetização SaaS.

Criar planos configuráveis no banco de dados e no painel administrativo.

### Planos iniciais propostos

**GRATUITO — R$ 0**
- 1 agente.
- 50 páginas indexadas.
- 50 respostas mensais.
- Marca da plataforma no widget.

**ESSENCIAL — R$ 97/mês**
- 1 agente.
- 2.000 páginas.
- 1.000 respostas mensais.

**PROFISSIONAL — R$ 297/mês**
- 3 agentes.
- 10.000 páginas.
- 5.000 respostas mensais.
- Relatórios e recursos avançados.

**EMPRESARIAL — R$ 897/mês**
- Até 10 agentes.
- 50.000 páginas.
- 20.000 respostas mensais.
- Recursos empresariais e governança.

**ENTERPRISE — SOB CONSULTA**
- Limites personalizados.
- SSO.
- Controles avançados.
- Contratos e suporte personalizados.
- Opções de residência de dados, quando contratadas e tecnicamente disponíveis.

Os preços são hipóteses comerciais iniciais e devem ser facilmente alteráveis sem modificar código.

### Adicionais configuráveis

- Pacotes extras de respostas.
- Páginas adicionais.
- Agentes adicionais.
- Conectores avançados.
- White label.
- Implantação assistida.

### Integração financeira

Priorizar Mercado Pago.

Preparar:

- Pix.
- Cartão de crédito.
- Outros métodos recorrentes efetivamente suportados.
- Gestão de assinatura.
- Cobrança recorrente.
- Cancelamento.
- Renovação.
- Falha de pagamento.
- Webhooks.
- Histórico financeiro.
- Upgrade e downgrade.
- Tratamento de prorrata, quando aplicável.

Não presumir que Pix recorrente ou débito recorrente possuem o mesmo fluxo de cartão. Verificar os recursos atualmente disponíveis na API oficial antes de implementar.

Implementar idempotência, verificação de assinaturas de webhook e reconciliação de pagamentos.

A emissão de nota fiscal deverá ser tratada como módulo independente e integrada a um serviço fiscal apropriado. Não presumir que o gateway emite NFS-e automaticamente.

### Controle de consumo

O sistema deverá limitar rigidamente:

- Respostas.
- Páginas indexadas.
- Quantidade de agentes.
- Armazenamento, quando aplicável.
- Uso de recursos premium.

Quando um limite for atingido, interromper o serviço correspondente e oferecer upgrade.

Não permitir consumo ilimitado sem controle de custo.

---

# 10. WHITE LABEL E REVENDA

Construir arquitetura para que agências e empresas parceiras possam revender a solução.

Funcionalidades:

- Marca personalizada.
- Logo próprio.
- Cores.
- Subdomínio.
- Domínio personalizado, quando configurado.
- Clientes subordinados ao parceiro.
- Painel de gestão das contas.
- Limites por cliente.
- Relatórios por cliente.
- Gestão comercial.
- Comissionamento configurável.
- Controle de faturamento.

Manter o isolamento de dados mesmo quando organizações compartilham o mesmo parceiro comercial.

---

# 11. ARQUITETURA TECNOLÓGICA

Priorizar baixo custo, simplicidade operacional e capacidade real de crescimento.

### Stack preferencial

**Frontend e aplicação**
- Next.js.
- TypeScript.
- React.
- Tailwind CSS.
- Componentes acessíveis e reutilizáveis.

**Backend e banco**
- Supabase.
- PostgreSQL.
- pgvector.
- Supabase Auth.
- Supabase Storage.
- Row Level Security.
- Funções e rotas de backend seguras.

**Inteligência artificial**
- API da OpenAI e/ou Anthropic.
- Abstração para múltiplos fornecedores.
- Modelo econômico configurável.
- Modelo mais avançado opcional para perguntas complexas.
- Embeddings de baixo custo.
- Pipeline próprio de RAG.

Não fixar nomes de modelos descontinuados ou indisponíveis. Verificar modelos e preços atuais na documentação oficial.

**Processamento**
- Extração de documentos.
- Sistema de filas e jobs.
- Crawling controlado.
- Processamento incremental.
- Retentativas com limites.
- Registro de erros.

**Hospedagem**
- Vercel ou alternativa de baixo custo, conforme requisitos reais.
- Supabase gerenciado.
- Serviços adicionais apenas quando necessários.

**Observabilidade**
- Logs estruturados.
- Métricas por cliente.
- Controle de tokens.
- Registro de custo.
- Alertas.
- Rastreamento de falhas.
- Monitoramento opcional com ferramentas como Langfuse.

### Diretriz econômica

Antes de adicionar qualquer serviço de infraestrutura, verificar:

1. Se é realmente necessário.
2. Se existe alternativa gratuita.
3. Se aumenta o custo fixo.
4. Se pode ser ativado somente quando houver demanda.
5. Se a solução pode ser substituída no futuro.

Não comprometer a segurança para economizar alguns reais.

---

# 12. MODELAGEM DO BANCO DE DADOS

Criar todas as migrations necessárias e manter versionamento.

Entidades principais sugeridas:

- users
- organizations
- organization_members
- invitations
- roles
- agents
- agent_settings
- knowledge_sources
- source_versions
- documents
- document_chunks
- embeddings
- ingestion_jobs
- sync_jobs
- conversations
- messages
- message_citations
- feedback
- unresolved_questions
- analytics_events
- integrations
- integration_credentials
- action_definitions
- action_executions
- api_keys
- plans
- subscriptions
- usage_events
- usage_limits
- payment_events
- invoices
- notifications
- audit_logs
- partner_accounts
- white_label_settings

Ajuste nomes e estrutura quando necessário para normalização, performance e integridade.

Criar índices, restrições, chaves estrangeiras e políticas RLS adequadas.

Credenciais devem ser armazenadas com proteção apropriada, nunca expostas ao frontend.

---

# 13. SEGURANÇA, LGPD E CONFIABILIDADE

Implementar desde o início:

- Isolamento multi-tenant.
- Row Level Security.
- Controle de acesso baseado em funções.
- Validação de entradas.
- Proteção contra injeção SQL.
- Proteção contra XSS.
- Proteção contra CSRF quando aplicável.
- Proteção contra SSRF.
- Limitação de requisições.
- Controle de upload.
- Validação de tipo e tamanho dos arquivos.
- Proteção contra prompt injection.
- Gerenciamento seguro de segredos.
- Logs de auditoria.
- Política de retenção de dados.
- Exportação de informações.
- Exclusão de dados.
- Backup e plano de recuperação.
- HTTPS em produção.
- Gestão de sessões.
- Restrições de acesso a arquivos privados.

Preparar recursos para apoiar obrigações da LGPD, incluindo transparência, finalidades de tratamento, solicitações de titulares, retenção e exclusão.

Não declarar que a plataforma está plenamente adequada à LGPD ou certificada sem revisão especializada.

Também não declarar residência integral de dados no Brasil enquanto todos os fornecedores e fluxos internacionais não forem verificados.

O lançamento com documentos sensíveis deverá depender de testes de segurança e revisão adequada.

---

# 14. SITE COMERCIAL

Criar um website profissional em português brasileiro.

Páginas:

1. Home.
2. Como funciona.
3. Funcionalidades.
4. Casos de uso.
5. Soluções por setor.
6. Preços.
7. Demonstração interativa.
8. Central de ajuda.
9. Contato.
10. Login e cadastro.
11. Termos de uso.
12. Política de privacidade.
13. Política de cookies, quando necessária.
14. Segurança.
15. API e desenvolvedores.

### Comunicação comercial

A apresentação deve deixar claro que a plataforma:

- Transforma documentos em respostas.
- Organiza conhecimento empresarial.
- Cita fontes.
- Reduz repetição de perguntas.
- Identifica falhas de documentação.
- Oferece inteligência gerencial.
- Integra diferentes sistemas.
- Possibilita automações.
- É desenvolvida para o mercado brasileiro.

Evitar promessas comerciais não comprovadas e métricas fictícias.

### Design

Criar uma identidade visual original, moderna, tecnológica e confiável.

Usar boas práticas de UX, acessibilidade, performance, SEO, responsividade e experiência mobile.

---

# 15. API PÚBLICA E DOCUMENTAÇÃO

Criar uma API versionada que permita:

- Gerenciar agentes.
- Cadastrar fontes.
- Consultar indexações.
- Enviar mensagens.
- Recuperar citações.
- Consultar uso.
- Receber webhooks.
- Executar ações autorizadas.
- Consultar relatórios permitidos.

Implementar:

- Autenticação por API key.
- Escopos e permissões.
- Rate limiting.
- Documentação OpenAPI.
- Exemplos de requisição.
- Tratamento padronizado de erros.
- Versionamento.
- Revogação de credenciais.

---

# 16. EXPERIÊNCIA DO CLIENTE E ONBOARDING

A experiência inicial deverá ser extremamente simples.

Fluxo desejado:

1. Usuário entra no site.
2. Cria conta.
3. Cria sua organização.
4. Escolhe um modelo de agente.
5. Envia PDF ou informa uma URL.
6. Aguarda o processamento.
7. Testa perguntas.
8. Visualiza respostas com fontes.
9. Personaliza o assistente.
10. Publica o widget ou compartilha o link.

O objetivo é que um usuário não técnico consiga testar o primeiro agente rapidamente, sem precisar conhecer programação, embeddings ou RAG.

Criar modelos iniciais para:

- Suporte a software.
- Central de ajuda.
- Documentação de produto.
- Treinamento interno.
- Franquias.
- Recursos humanos.
- Perguntas frequentes.

---

# 17. TESTES E QUALIDADE

Criar testes unitários, integração e ponta a ponta.

### Casos obrigatórios

**Documentos**
- Importação válida.
- Arquivo inválido.
- Documento vazio.
- PDF com múltiplas páginas.
- Documento com tabela.
- Documento duplicado.
- Atualização de fonte.
- Exclusão e remoção de índices.

**Inteligência artificial**
- Pergunta com resposta existente.
- Pergunta sem resposta.
- Resposta com fonte correta.
- Tentativa de inventar citação.
- Documento com instrução maliciosa.
- Fontes contraditórias.
- Pesquisa em diferentes organizações.

**Segurança**
- Usuário da empresa A tentando acessar documentos da empresa B.
- Usuário sem permissão tentando administrar um agente.
- Upload indevido.
- Acesso a arquivo privado.
- Tentativa de ultrapassar os limites do plano.
- Requisições indevidas ao crawler.

**Pagamentos**
- Assinatura criada.
- Falha.
- Renovação.
- Cancelamento.
- Webhook duplicado.
- Upgrade.
- Limite atingido.

**Interface**
- Cadastro.
- Login.
- Upload.
- Conversa.
- Publicação.
- Configurações.
- Gestão de planos.
- Acessibilidade básica.
- Funcionamento mobile.

Criar um conjunto de avaliação de RAG em português brasileiro, com perguntas e respostas de referência verificadas.

Não medir apenas se a IA produz uma resposta: avaliar se a resposta está sustentada pelos documentos corretos.

---

# 18. ESTRATÉGIA DE DESENVOLVIMENTO POR FASES

**A META FINAL É IMPLEMENTAR A PLATAFORMA COMPLETA, NÃO APENAS O MVP.**

Porém, implemente em etapas para reduzir custo, evitar retrabalho e manter o sistema funcionando.

## FASE 0 — FUNDAÇÃO

- Inspecionar o ambiente.
- Definir arquitetura.
- Inicializar o repositório.
- Criar estrutura de pastas.
- Configurar Next.js e TypeScript.
- Configurar testes e lint.
- Criar variáveis de ambiente de exemplo.
- Preparar Supabase.
- Criar migrations.
- Criar autenticação.
- Implementar organizações e RLS.
- Configurar CI.

**Entrega:** aplicação inicial funcional, autenticada e segura.

## FASE 1 — MOTOR CENTRAL DE CONHECIMENTO

- Upload de PDF, DOCX e texto.
- Importação de URLs.
- Extração de conteúdo.
- Fragmentação.
- Embeddings.
- Indexação.
- Busca híbrida.
- Pipeline RAG.
- Respostas com citações.
- Comportamento de recusa sem evidência.
- Testes automatizados.

**Entrega:** sistema que realmente responde perguntas a partir dos documentos.

## FASE 2 — SAAS COMERCIAL INICIAL

- Criação de agentes.
- Dashboard.
- Personalização.
- Widget.
- Links de compartilhamento.
- Histórico.
- Controle de consumo.
- Planos.
- Pagamento.
- Onboarding.
- Site comercial.

**Entrega:** primeiro produto comercializável.

## FASE 3 — INTELIGÊNCIA EMPRESARIAL

- Painel analítico.
- Perguntas frequentes.
- Perguntas sem resposta.
- Agrupamento de assuntos.
- Identificação de lacunas.
- Relatórios.
- Avaliações de qualidade.
- Alertas sobre documentos.
- Exportação de relatórios.

**Entrega:** sistema de gestão e inteligência do conhecimento.

## FASE 4 — FONTES E CONECTORES AVANÇADOS

- Crawl de sites maiores.
- Sincronização incremental.
- Google Drive.
- Notion.
- SharePoint.
- Confluence.
- Integrações brasileiras.
- Controle avançado de versões.
- Reprocessamento automático.

**Entrega:** plataforma de ingestão profunda de conhecimento.

## FASE 5 — AÇÕES E AUTOMAÇÕES

- Ferramentas e workflows.
- Webhooks.
- Integrações com CRMs.
- Consulta a ERPs.
- Abertura de tickets.
- Agendamentos.
- Aprovação humana.
- Registro de ações.
- Integrações MCP autorizadas.

**Entrega:** agentes capazes de executar tarefas além de responder.

## FASE 6 — MULTICANAL E ENTERPRISE

- WhatsApp oficial.
- Recursos de voz.
- SSO.
- Governança avançada.
- Políticas de retenção.
- Controles empresariais.
- Monitoramento ampliado.
- Ferramentas de administração.

**Entrega:** plataforma preparada para clientes empresariais mais exigentes.

## FASE 7 — WHITE LABEL E ESCALA

- Área de agências.
- Domínios personalizados.
- Revenda.
- Gestão de clientes subordinados.
- Comissões.
- Otimizações de custos.
- Otimizações de performance.
- Escalabilidade.
- Documentação avançada de API.

**Entrega:** plataforma com canais de distribuição e operação em escala.

Cada fase deve terminar com testes, documentação e demonstração funcional.

Não avance deixando falhas críticas de segurança na fase anterior.

---

# 19. CONTROLE DE CUSTOS

Como o proprietário pretende começar com investimento financeiro extremamente reduzido, implemente:

- Preferência por planos gratuitos durante o desenvolvimento.
- Arquitetura sem servidores caros desnecessários.
- Modelos de IA econômicos por padrão.
- Configuração flexível de modelos.
- Cache seguro quando fizer sentido.
- Limites de tokens.
- Limites por organização.
- Limites de indexação.
- Controle de jobs.
- Logs de custo por chamada.
- Relatórios financeiros por cliente.
- Alertas de consumo.
- Bloqueio de uso excessivo.
- Possibilidade de desativar recursos custosos.

Criar documentação com:

1. Serviços necessários.
2. Serviços gratuitos.
3. Custos opcionais.
4. Estimativas mensais por volume de uso.
5. Riscos de custos inesperados.
6. Como ampliar capacidade quando o SaaS crescer.

Não prometer custo zero para operação em produção.

---

# 20. ARQUIVOS DE DOCUMENTAÇÃO OBRIGATÓRIOS

Manter no repositório:

- README.md — visão e instalação.
- AGENTS.md — instruções persistentes para desenvolvimento.
- docs/ARCHITECTURE.md — arquitetura técnica.
- docs/PRD.md — requisitos do produto.
- docs/ROADMAP.md — roadmap integral.
- docs/PROGRESS.md — progresso real.
- docs/DECISIONS.md — decisões técnicas.
- docs/DATABASE.md — banco e migrations.
- docs/SECURITY.md — controles de segurança.
- docs/INTEGRATIONS.md — integrações.
- docs/RAG.md — pipeline de IA.
- docs/BILLING.md — cobrança e consumo.
- docs/DEPLOYMENT.md — publicação.
- docs/COSTS.md — custos.
- docs/TESTING.md — testes e evidências.
- docs/BLOCKERS.md — bloqueios e credenciais necessárias.
- .env.example — variáveis sem valores secretos.

Em PROGRESS.md, identificar cada funcionalidade como:

- Não iniciada.
- Em desenvolvimento.
- Implementada.
- Testada.
- Bloqueada.
- Pronta para produção, somente quando realmente validada.

---

# 21. CRITÉRIOS DE ENTREGA FINAL

A plataforma só poderá ser considerada tecnicamente completa quando:

1. Usuários puderem criar organizações.
2. Organizações estiverem devidamente isoladas.
3. Documentos puderem ser processados.
4. A IA responder com citações verificáveis.
5. Perguntas sem resposta forem identificadas.
6. Agentes puderem ser configurados.
7. O widget funcionar em sites externos.
8. O painel analítico produzir dados reais.
9. Assinaturas e limites funcionarem.
10. Integrações anunciadas como prontas estiverem efetivamente testadas.
11. As ações dos agentes respeitarem permissões.
12. Os testes de segurança essenciais passarem.
13. A documentação de instalação e operação existir.
14. O sistema puder ser publicado sem depender de mocks.
15. Não houver bloqueios críticos de segurança conhecidos.

Funcionalidades bloqueadas por acesso a serviços externos deverão permanecer claramente identificadas, sem falsa indicação de conclusão.

---

# 22. FORMATO DAS SUAS ATUALIZAÇÕES

Ao concluir cada etapa, informe de maneira simples:

**ETAPA CONCLUÍDA:** nome da etapa.

**O QUE FOI CRIADO:** principais funcionalidades implementadas.

**O QUE FOI TESTADO:** testes executados e seus resultados reais.

**O QUE FALTA:** próximos módulos.

**CUSTO:** serviços pagos ativados ou custos potenciais, se houver.

**AÇÃO NECESSÁRIA DO PROPRIETÁRIO:** somente quando for indispensável.

**PRÓXIMA ETAPA:** tarefa que será implementada a seguir.

Não use linguagem excessivamente técnica nas atualizações destinadas ao proprietário.

O proprietário não é programador. Explique configurações externas em português, com passos claros.

---

# 23. ORDEM PARA COMEÇAR AGORA

COMECE IMEDIATAMENTE.

1. Examine o repositório e os arquivos disponíveis.
2. Leia os PRDs anexados, caso estejam presentes.
3. Verifique as versões atuais e a compatibilidade das tecnologias escolhidas.
4. Proponha uma arquitetura objetiva e econômica.
5. Crie ROADMAP.md, ARCHITECTURE.md, AGENTS.md e PROGRESS.md.
6. Inicialize a aplicação, caso ainda não exista.
7. Implemente autenticação, organizações e isolamento multi-tenant.
8. Crie o banco de dados com migrations e políticas RLS.
9. Implemente o primeiro pipeline RAG funcional.
10. Execute testes reais e corrija as falhas.
11. Continue as fases seguintes, conforme os critérios deste documento.

Não espere que eu solicite cada página, módulo ou funcionalidade separadamente.

Você está autorizado a executar as tarefas de desenvolvimento dentro do ambiente disponível, mas deverá solicitar aprovação para despesas, deploy público, uso de credenciais sensíveis e operações externas de risco.

**MISSÃO FINAL: ENTREGAR UMA PLATAFORMA SAAS BRASILEIRA COMPLETA DE INTELIGÊNCIA DO CONHECIMENTO EMPRESARIAL, INSPIRADA NA PROFUNDIDADE DO DOCSBOT, COM CÓDIGO PRÓPRIO, ALTA QUALIDADE, SEGURANÇA, POSSIBILIDADE DE ESCALA E O MENOR CUSTO VIÁVEL DE DESENVOLVIMENTO.**

INICIE A IMPLEMENTAÇÃO AGORA.