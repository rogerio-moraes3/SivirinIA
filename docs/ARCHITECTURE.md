# Arquitetura

## Implementado

- App Router Next.js, componentes React no servidor, Server Actions para mutações e componentes cliente para estados de formulário.
- Supabase SSR com cookies; validação por `auth.getUser()` nas operações privadas e atualização de sessão em `proxy.ts`.
- PostgreSQL com RLS em todas as tabelas empresariais. `has_role` e `can_read_source` verificam a identidade autenticada; funções SECURITY DEFINER têm search_path vazio e privilégios explícitos.
- Escritas passam por funções transacionais com autorização, lock da organização, cotas e auditoria. Não há chave administrativa na aplicação.
- Importação síncrona limitada a 10 MB/2 milhões de caracteres, com job registrado, uma importação simultânea por organização, cinco admissões por minuto e reserva de páginas antes dos embeddings.
- Extração em memória; o arquivo original não é armazenado nesta versão. PostgreSQL armazena texto, fragmentos, hash, versão e metadados. O parser DOCX lê somente o XML do documento, sem executar macros ou carregar links externos.
- Busca textual GIN/português e similaridade pgvector opcional. O índice vetorial aproximado será introduzido após medição de volume; atualmente a similaridade é exata sobre os candidatos autorizados.
- Chat privado com reserva atômica de quota, persistência de mensagens, referências e feedback. Pergunta atual é a entrada da recuperação; reformulação contextual ainda não existe.
- Adaptação de IA OpenAI compatível com os endpoints oficiais de embeddings/chat; modelo é configuração, não uma promessa de disponibilidade.
- Marketing e painel responsivos em português. Não há catálogo de integrações fictícias.

## Fronteiras

O navegador nunca escolhe o tenant por confiança: o identificador é validado no servidor e novamente por RLS. Nenhum serviço usa service_role. Conteúdo externo nunca vira instrução de sistema. Compartilhamento público exige confirmação do proprietário/administrador, seleção explícita de fontes e token de 256 bits. RPCs públicas verificam token e whitelist de fontes, sem conceder leitura direta das tabelas. O widget isola CSS com Shadow DOM e carrega um iframe do domínio da aplicação. Sem custos externos ativados por padrão.

## Evolução

Fila assíncrona com leases duráveis, armazenamento privado dos originais, provedores adicionais, cache por tenant, índice vetorial medido, personalização avançada do widget, billing reconciliado e conectores oficiais continuam no roadmap. Não introduzir serviços pagos antes de necessidade e autorização.

Publicações são revogáveis e rotacionam token a cada reativação; alterações de ACL da fonte ou rebaixamento de perfil do publicador revogam links. Perguntas públicas aceitas são registradas e consomem a cota mensal; respostas públicas não são persistidas nesta etapa. Não há memória de conversa pública nem feedback público.

Runtime local de baixo custo: imagens pequenas fixadas em infra/compose.yml, banco PostgreSQL/pgvector, Supabase Auth GoTrue e PostgREST reais. Gateway Node só encaminha endpoints padrão e não substitui JWT/RLS. Bootstrap de roles/helpers em infra/bootstrap.sh; compatibilidade de claims em infra/auth-compat.sql; migrations aplicadas por scripts/db-migrate.mjs com hash/versão em schema interno não exposto. Essa orquestração é exclusiva de desenvolvimento, sem Storage/Studio/Realtime.
