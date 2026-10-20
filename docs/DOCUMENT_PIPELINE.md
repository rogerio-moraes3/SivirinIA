# Documentos privados e fila

`npm run db:start` aplica migrations e provisiona uma credencial local restrita em `.local/worker.env`. Preserve esse arquivo privado junto ao runtime. Execute `npm run worker` em processo separado da aplicação; `--once` processa no máximo uma tarefa. Em instalação gerenciada, configure WORKER_DATABASE_URL com o papel dedicado por canal seguro. Nunca use o usuário postgres no worker.

Fluxo de arquivos/texto: sessão e perfil → admissão transacional + original privado → tarefa na fila → claim com lease → parser em processo filho → hash/fragmentos → commit atômico de fonte, índices, snapshot e status. O painel atualiza status a cada 3 segundos enquanto há tarefas ativas. Erros têm códigos/descrições fixas; não exibem diagnóstico bruto, conteúdo ou segredos.

Uma tarefa em execução por organização. Leases duram 120 segundos; extração tem prazo de 60 segundos e heap V8 de 512 MB. Entradas até 10 MB; texto até 2 milhões de caracteres, 2 mil fragmentos; saída do filho limitada. Processo filho não recebe credenciais de banco/IA/aplicação. Isso não substitui sandbox do sistema operacional, limite de RSS, antivírus nem corpus adversarial.

Falhas transitórias recebem backoff e até três tentativas. Leases abandonados podem ser reivindicados e rotacionam token; um worker antigo não pode concluir. Cancelar descarta o original pendente e invalida o lease. Tarefas com erro retêm entrada para tentativa ou descarte explícito. Após três tentativas, é necessário corrigir e reenviar; não existe loop de retry ilimitado.

Originais ficam em bytea privado no PostgreSQL, snapshots em JSONB por versão, sem URLs públicas. Download exige sessão e ACL atual, sempre como anexo/nosniff/no-store. Revogar ACL protege também versões antigas. Exclusão de fonte/organização remove snapshots, índices e entradas relacionadas por cascade. Backups de banco ainda exigem política operacional de retenção e restauração.

Quota de armazenamento inclui todas as versões e entradas pendentes/falhas; 100 MiB inicial por organização, configurável em plans. Até 20 versões por fonte. A quota de páginas continua derivada dos fragmentos no commit. Atualização concorrente é rejeitada por versão esperada. Duplicatas não substituem silenciosamente outra fonte. Conteúdo extraído idêntico mantém os índices/versão atuais.

Limites atuais: sem OCR, sem alinhamento semântico de trechos deslocados, sem embeddings neste worker, sem atualização agendada. URLs ainda usam o importador síncrono e não preservam original/snapshot. Versões anteriores à fila não podem ter seus arquivos reconstruídos e aparecem como somente metadados. PostgreSQL bytea é uma implementação privada real e limitada; backend de objetos é evolução necessária para maiores volumes.

Atualização incremental: fragmentos com texto/página/posição idênticos preservam IDs e embeddings já existentes; fragmentos modificados são reconstruídos e vetores antigos descartados. Isso reduz gravações sem inventar embeddings novos nem reindexação semântica completa.
