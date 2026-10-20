# SivirinIA

Plataforma brasileira de conhecimento empresarial. Next.js 16, React 19, TypeScript, Tailwind 4, Supabase Auth, PostgreSQL com pgvector e PostgREST.

**Código funcional em desenvolvimento; ainda não é uma plataforma completa nem está pronta para produção.** Os dados da interface vêm do banco. Não há clientes, agentes, respostas ou indicadores fictícios pré-carregados. Fixtures existem exclusivamente nos testes.

## Iniciar neste ambiente

Requisitos: Node.js 24, npm 11, Docker com Compose v2. O ambiente de 32 GB usa componentes reais separados, com imagens fixadas por digest. Não é necessário instalar a distribuição Docker completa do Supabase.

```bash
cd /workspace/SivirinIA
bash scripts/install.sh
npm run db:start
npm run env:local
npm run dev
```

Use o checkout existente; não crie worktrees sem solicitação. `install.sh` usa npm ci, prepara a configuração local e baixa apenas as quatro imagens necessárias. `db:start` inicia PostgreSQL/pgvector, GoTrue (Supabase Auth), PostgREST, captura local de e-mail e gateway de desenvolvimento, e aplica migrations novas. Não apaga dados existentes.

`env:local` cria `.env.local` apenas se ele não existir e nunca imprime as chaves. `.local/runtime.env` contém os segredos gerados da instância local; preserve esse arquivo junto ao volume Docker. Não o versione, publique nem o copie para clientes. Remover esse arquivo independentemente do banco perde a correspondência das credenciais. As portas do banco e APIs internas escutam somente em loopback.

Mantenha somente **um servidor Next.js por checkout**. O comando dev fixa a porta 3000 e não tenta iniciar silenciosamente outra instância. Se ela estiver ocupada, inspecione o processo existente; não mate serviços de outra tarefa.

```bash
npm run ready
```

Esse comando verifica a aplicação, o catálogo via API SQL e o serviço Auth. A jornada completa é validada pelos testes E2E.

## Recursos implementados

- Cadastro, login, logout, recuperação de senha e sessões em cookies HttpOnly.
- Organizações, troca de workspace, perfis, convites por código vinculado ao e-mail confirmado, alteração de perfil e exclusão de organização pelo proprietário mediante confirmação do nome.
- Agentes: criar, editar, excluir e selecionar fontes permitidas.
- Importação de PDF com texto, DOCX, TXT, Markdown, CSV e HTML, até 10 MB/2 milhões de caracteres; hash, fragmentação e indexação textual em português.
- Perguntas com trechos reais, documento, página de PDF e versão; recusa quando não há evidência.
- Histórico privado com múltiplas perguntas, feedback, CSV, indicadores observados, perguntas frequentes e sem resposta, uso das fontes e consumo.
- Fontes com permissões por perfil, atualização/reindexação e versões de metadados. O texto integral das versões antigas e os arquivos originais ainda não são armazenados.
- Link compartilhável e widget Shadow DOM/iframe com seleção explícita de fontes públicas, confirmação do administrador, token rotacionável e revogação. Alterações de ACL ou rebaixamento do publicador revogam os links.
- Planos configuráveis no banco e cotas transacionais. Nenhuma cobrança está ativa.
- Site comercial responsivo com preços identificados como propostas, sem checkout fictício.

O widget consulta somente as fontes publicadas, e não toda a base privada. Perguntas públicas aceitas consomem a mesma franquia mensal e são registradas; suas respostas não são persistidas nesta versão. O painel de inteligência mostra o histórico privado do próprio usuário, não conversas privadas de colegas.

A cota de páginas usa o maior valor entre unidades de 3.000 caracteres indexados (incluindo sobreposição) e, no PDF, a posição física da última página com texto. O banco recalcula o tamanho, sem confiar no valor informado pelo cliente.

## IA e importação de sites

Sem chave/ativação, a interface mostra **busca documental sem geração por IA**. O adaptador OpenAI para embeddings e geração citada foi implementado e seus contratos foram testados com simulador somente nos testes. Nenhuma chamada paga ou validação real de modelo foi executada.

Ativação futura autorizada: configurar AI_API_KEY, AI_CHAT_MODEL, opcionalmente AI_EMBEDDING_MODEL (compatível com dimensões=1536), tarifas atuais e AI_ENABLED=true. As tarifas desconhecidas permanecem nulas. Não habilitar sem autorização de despesas. Documentos já indexados precisam ser reindexados para ganhar embeddings. Veja docs/COSTS.md e docs/BLOCKERS.md.

O importador HTTPS foi implementado com proteção SSRF, DNS validado, IP fixado, TLS, robots.txt e limites. O DNS público direto desta nuvem retorna EAI_AGAIN; portanto, a importação de sites está **bloqueada nesta máquina**. Arquivos e texto funcionam independentemente. Não enfraquecer a validação de rede para contornar o bloqueio.

## Testes

```bash
npm run lint
npm run typecheck
npm test
npm run db:test
npm run test:cold-start
# Pare o servidor dev antes; este comando compila e inicia a versão de produção local.
npm run test:e2e
```

Os testes de navegador usam /usr/bin/chromium; configure CHROMIUM_PATH em outra máquina. Eles recusam bancos remotos e IA paga ativada. Criam contas e conteúdos claramente identificados como teste na instância local. Os testes SQL usam PostgreSQL real, trocam os papéis/claims e revertem as fixtures por rollback. Os helpers em infra/test-assertions.sql preservam o papel sob teste; não são mocks de banco nem pgTAP.

O teste cold-start cria e remove somente uma stack/volume de teste isolados e valida bootstrap/Auth/migrations/busca do zero. O cache npm do projeto é gravável em .cache/npm, sem depender do diretório pessoal somente leitura desta nuvem.

O workflow GitHub Actions está configurado; sua execução no GitHub ainda não foi realizada. Resultados locais e limitações estão em docs/TESTING.md, docs/PROGRESS.md e docs/BLOCKERS.md.

## Supabase gerenciado e produção futura

A aplicação usa os endpoints padrão de Supabase. Para um projeto gerenciado autorizado, configurar a URL/chave pública e aplicar as migrations versionadas. Não usar service_role no frontend. A configuração Compose é **somente de desenvolvimento**, com confirmação de e-mail desativada e caixa de e-mail local. Não a exponha como instalação comercial.

Em produção: definir APP_URL com a origem HTTPS real e permiti-la nos callbacks do Auth; ativar confirmação de e-mail e SMTP; configurar armazenamento privado, backups, monitoramento, limites financeiros e políticas de retenção; completar testes e revisões de segurança/LGPD. Callback não confia em host arbitrário nem no endereço interno de bind 0.0.0.0.

Nenhum deploy público foi feito. Pagamentos, conectores, automações, WhatsApp, SSO e white label ainda precisam de implementação e validação, conforme o roadmap.
