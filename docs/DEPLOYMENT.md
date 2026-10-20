# Execução, ambiente e publicação

A sequência funcional está no README. Desenvolvimento: instalar dependências/imagens, npm run db:start, npm run env:local, npm run worker em processo separado e npm run dev. O starter aplica migrations novas por hash e recusa alterações em migrations já aplicadas; não faz reset de dados.

O runtime usa PostgreSQL/pgvector, Supabase Auth (GoTrue), PostgREST, Mailpit local e gateway Node de desenvolvimento. Imagens fixadas por digest em infra/compose.yml. O bootstrap cria papéis e helpers compatíveis com Supabase; GoTrue aplica suas migrations reais de Auth. Não há simulação de usuários ou banco. A distribuição Docker completa do CLI excedeu o disco e foi substituída por esses componentes menores.

Arquivos/volumes persistidos não equivalem a processos ativos. Após restauração, reiniciar containers/gateway via db:start, worker restrito e apenas um servidor Next. Preservar .local/runtime.env e .local/worker.env junto ao volume; não regenerar credenciais de um banco existente. Se .env.local já existe, env:local o preserva.

Testes E2E fazem build e iniciam a versão de produção local. Precisam da porta 3000 livre, rejeitam destinos remotos e IA ativada. Não iniciar dois Next no mesmo checkout. O site de cliente no teste do widget é outro servidor HTTP local, sem deploy público.

Não foi publicado site nem snapshot de ambiente. Antes de qualquer deploy público autorizado: concluir bloqueios, definir APP_URL com o domínio HTTPS real, permitir callbacks no Auth, exigir confirmação de e-mail e SMTP, instalar migrations em ambiente de teste, configurar Storage/backups/monitoramento e validar segurança/custos/privacidade. A configuração Compose não é uma configuração de produção.

A configuração reutilizável da nuvem separa install_script (dependências/imagens/arquivos) e start_skill (processos e verificações). Salvar rascunho não executa scripts nem publica snapshot. Restauração em tarefa nova ainda não foi verificada.

O rascunho de configuração da nuvem foi atualizado para iniciar o worker e consultar resultados em docs/TESTING.md, sem contagens fixas antigas. Permanece salvo para revisão/publicação privada do ambiente; não equivale a deploy público.
