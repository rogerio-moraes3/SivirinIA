# Arquitetura

## Implementado

- App Router Next.js, componentes React no servidor, Server Actions para mutações e componentes cliente para estados de formulário.
- Supabase SSR com cookies; validação por `auth.getUser()` nas operações privadas e atualização de sessão em `proxy.ts`.
- PostgreSQL com RLS em todas as tabelas empresariais. `has_role` e `can_read_source` verificam a identidade autenticada; funções SECURITY DEFINER têm search_path vazio e privilégios explícitos.
- Escritas passam por funções transacionais com autorização, lock da organização, cotas e auditoria. Não há chave administrativa na aplicação.
- Arquivos/textos de até 10 MB/2 milhões de caracteres entram em fila PostgreSQL durável. Worker com papel restrito, parser separado e uma tarefa por organização; cinco admissões/minuto. URLs ainda seguem caminho síncrono com reserva antes dos embeddings.
- Originais privados e snapshots integrais de novos arquivos/textos ficam em PostgreSQL bytea/JSONB, com quota. A aplicação baixa originais somente após autenticação e ACL atual da fonte. Parser em processo filho com heap/prazo limitados. O parser DOCX lê somente o XML do documento, sem executar macros ou carregar links externos.
- Busca textual GIN/português e similaridade pgvector opcional. O índice vetorial aproximado será introduzido após medição de volume; atualmente a similaridade é exata sobre os candidatos autorizados.
- Chat privado com reserva atômica de quota, persistência de mensagens, referências e feedback. Pergunta atual é a entrada da recuperação, com normalização lexical de perguntas naturais e filtro por agente. Reformulação contextual ainda não existe; geração pode receber somente perguntas anteriores limitadas, nunca respostas antigas como evidência.
- Adaptação de IA OpenAI compatível com os endpoints oficiais de embeddings/chat; modelo é configuração, não uma promessa de disponibilidade.
- Marketing e painel responsivos em português. Não há catálogo de integrações fictícias.

## Fronteiras

O navegador nunca escolhe o tenant por confiança: o identificador é validado no servidor e novamente por RLS. Nenhum serviço usa service_role. Conteúdo externo nunca vira instrução de sistema. Compartilhamento público exige confirmação do proprietário/administrador, seleção explícita de fontes e token de 256 bits. RPCs públicas verificam token e whitelist de fontes, sem conceder leitura direta das tabelas. O widget isola CSS com Shadow DOM e carrega um iframe do domínio da aplicação. Sem custos externos ativados por padrão.

## Evolução

Backend de objetos escalável, OCR, embeddings assíncronos, provedores adicionais, cache por tenant, índice vetorial medido, personalização avançada do widget, billing reconciliado e conectores oficiais continuam no roadmap. Não introduzir serviços pagos antes de necessidade e autorização.

Publicações são revogáveis e rotacionam token a cada reativação; alterações de ACL da fonte ou rebaixamento de perfil do publicador revogam links. Perguntas públicas aceitas são registradas e consomem a cota mensal; respostas públicas não são persistidas nesta etapa. Não há memória de conversa pública nem feedback público.

Runtime local de baixo custo: imagens pequenas fixadas em infra/compose.yml, banco PostgreSQL/pgvector, Supabase Auth GoTrue e PostgREST reais. Gateway Node só encaminha endpoints padrão e não substitui JWT/RLS. Bootstrap de roles/helpers em infra/bootstrap.sh; compatibilidade de claims em infra/auth-compat.sql; migrations aplicadas por scripts/db-migrate.mjs com hash/versão em schema interno não exposto. Essa orquestração é exclusiva de desenvolvimento, sem Storage/Studio/Realtime.

Manutenção incremental de índice preserva IDs/embeddings de fragmentos idênticos na mesma posição/página. Relatórios compartilham carregador com RLS e limites, filtro temporal em São Paulo, CSV e PDF gerado com pdf-lib. Nenhuma métrica estimada por modelo é apresentada como observação.
