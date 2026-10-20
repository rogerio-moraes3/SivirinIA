# Homologação SivirinIA — preparação, sem publicação

Nenhuma URL pública foi criada ou confirmada nesta etapa. Não há projeto Vercel vinculado nem credenciais de Supabase gerenciado neste checkout. Não exponha o runtime local: ele usa autenticação de desenvolvimento. Não reutilize `.env.local` ou `.local/*.env` na nuvem.

## Autorização e acessos

**Publicação de homologação autorizada em 20/10/2026**, sem gastos nem lançamento comercial. O usuário já tem contas Vercel/Supabase. Faltam conectar os acessos, criar/selecionar o projeto exclusivo e escolher o host do worker; passos em [STAGING_ACCESS.md](STAGING_ACCESS.md). Não solicitar novamente a autorização já recebida. Nenhuma contratação, upgrade ou IA paga está autorizada. Verificar a elegibilidade e os limites dos planos gratuitos no momento da criação; se algum plano exigir pagamento, parar. Vercel Hobby tem restrições de uso comercial: não pressupor que atende ao SaaS comercial. O worker exige uma máquina persistente existente; sem ela, escolher hospedagem e aprovar qualquer custo antes de contratar. Não há garantia de servidor gratuito permanente.

## Arquitetura e limites

Frontend Next.js na Vercel; Auth, PostgreSQL, fila e documentos privados no Supabase de testes. Worker Node/Tesseract/Poppler em Docker numa máquina Linux persistente, com reinício automático. Não há portas do worker expostas. O host precisa permanecer ligado e ter acesso de saída HTTPS e PostgreSQL. Reservar aproximadamente 2 GB de RAM para o worker. Documentos permanecem no banco privado, sujeitos a ACL/RLS e cota de 100 MiB por organização, competindo com a capacidade do plano Supabase. Não carregar acervos reais.

Uploads na Vercel/homologação limitados a **3 MiB** para deixar margem abaixo do limite de payload das funções. O parser local mantém 10 MiB. OCR opt-in limitado a cinco páginas/imagens por documento. Upload maior e armazenamento de objetos direto ainda exigem implementação. A disponibilidade do OCR remoto é declarada na configuração, não um monitor de saúde.

## 1. Projeto de testes e migrations

Criar projeto Supabase vazio, com nome claramente identificado como homologação, sem dados importados de produção. Anotar referência e comparar explicitamente com qualquer projeto de produção. Não executar `infra/bootstrap.sh` no serviço gerenciado. Ele é exclusivamente local.

As migrations são aplicadas por `npm run staging:migrate`, manualmente numa máquina confiável, com Node 24 e `npm ci`. Configure no gerenciador de segredos/ambiente do operador:

- `APP_ENV=staging`, `STAGING_SUPABASE_PROJECT_REF` e `STAGING_MIGRATION_CONFIRM` iguais à referência de testes.
- `PRODUCTION_SUPABASE_PROJECT_REF` se houver produção (a referência de testes precisa ser diferente).
- `STAGING_DATABASE_URL`: conexão administrativa `postgres` direta ou pooler **de sessão**, porta 5432, copiada do dashboard e senha codificada para URL.
- `WORKER_CA_FILE` se o certificado exigir a CA fornecida no dashboard. Nunca usar `rejectUnauthorized=false` ou `sslmode=no-verify`.

O script valida alvo, exige Auth existente, verifica hashes, usa lock e transações por migration e não reseta tabelas. Ainda precisa ser executado e validado num Supabase gerenciado; falhas de privilégios/extensões devem ser corrigidas sem contornar proteções. `vector` e `pgcrypto` precisam estar no schema `extensions`. Credenciais administrativas nunca vão para a Vercel ou o worker.

## 2. Cadastro fechado, e-mails e callbacks

No SQL Editor do projeto de testes, adicionar apenas e-mails de testadores autorizados à tabela `sivirinia_internal.staging_allowed_emails`, em minúsculas. Não versionar a lista. Habilitar em Authentication > Hooks o hook PostgreSQL **Before User Created**, função `public.staging_before_user_created`. Testar uma conta permitida e outra negada diretamente pelo Auth, antes de abrir o site. Sem habilitar o hook, a tabela sozinha não restringe cadastros.

Manter confirmação de e-mail habilitada. O envio padrão Supabase tem restrições: configurar SMTP compatível, sem contratar serviço pago sem aprovação, ou usar contas permitidas pelo envio padrão. Validar confirmação, recuperação e entrega real. Nunca ativar autoconfirmação global para contornar SMTP.

Depois de obter o domínio real da Vercel, definir Site URL com essa origem HTTPS e a lista exata de redirects:

- `ORIGEM_REAL/auth/callback`
- `ORIGEM_REAL/auth/callback?next=/reset-password`

Substituir `ORIGEM_REAL`; não é uma URL já publicada. Não liberar curingas de preview nem domínios arbitrários. Atualizar `APP_URL` com a mesma origem e repetir testes se o domínio mudar.

## 3. Worker persistente

O papel restrito `sivirinia_worker` é criado pelas migrations. No SQL Editor, definir uma senha aleatória para ele e habilitar LOGIN; o comando é `ALTER ROLE sivirinia_worker LOGIN PASSWORD 'SENHA_GERADA';` (não usar esse literal, não registrar senha em código/chat). Não conceder memberships, BYPASSRLS, superuser ou acesso administrativo. Copiar conexão para `/etc/sivirinia/worker.env`, pertencente ao operador e modo 600, usando `deploy/worker.env.example`. No pooler de sessão, usuário `sivirinia_worker.REFERENCIA`; no direto, `sivirinia_worker`. Conexão direta pode exigir IPv6. O processo verifica `current_user` e TLS com certificado/hostname; erro de certificado não deve ser ignorado. O Compose monta o bundle de CAs do host somente leitura. Se necessário, selecionar uma CA de testes confiável com `WORKER_CA_HOST_FILE` no ambiente do host; o container usa o caminho interno de certificado. Para execução Node manual, indicar `WORKER_CA_FILE`.

No checkout dessa máquina, executar:

```sh
docker compose -f deploy/worker.compose.yml build
docker compose -f deploy/worker.compose.yml up -d
docker compose -f deploy/worker.compose.yml logs --tail 30 worker
```

Após construir, `node scripts/check-worker-image.mjs` verifica PDFs de teste dentro do container sem rede/root. A imagem instala OCR português com hash verificado. Contexto Docker é uma lista de arquivos permitidos; `.env*`, `.local` e documentos não são incluídos. Container roda sem root, sem capabilities, filesystem somente leitura e temporários limitados. Persistência está na fila Supabase; reiniciar o container não apaga tarefas/documentos. Isso não substitui backup. Ainda não há heartbeat/alertas de indisponibilidade. Uma máquina desligada deixa tarefas aguardando. Avaliar atualizações periódicas da imagem base e dependências; a base Node foi fixada por digest; pacotes apt continuam sujeitos a atualizações dos repositórios. Em redes corporativas, a CA de build pode ser fornecida por BuildKit secret `build_ca`, sem incluí-la na imagem e sem desativar validação TLS.

## 4. Vercel, somente depois de autorizar publicação

Importar o repositório existente, sem criar outro projeto de código ou apagar histórico. Definir Node 24 e preencher as variáveis de `deploy/frontend.env.example` no escopo de homologação. Nunca enviar URL de banco, senha de worker, service_role, chave secreta Supabase, tokens de pagamento ou chave de IA para esse projeto. A única chave pública é anon/publishable do Supabase de testes. `npm run staging:check` valida configuração antes do build, mas não comprova conectividade ou segurança remota.

`vercel.json` desabilita deploys automáticos via Git e exige preflight + build. A primeira importação/manual deployment ainda publica: só executá-la após autorização. Não vincular a domínios de produção. Configurar proteção de acesso se disponível sem custo no plano escolhido; hook de cadastro não substitui proteção do frontend. Não configurar tarefas cron/funções temporárias para hospedar o worker.

Configurar `OCR_WORKER_ENABLED=true` somente quando o worker estiver pronto. Testar a ingestão; a flag não consulta o processo remoto. IA e pagamentos ficam desativados. O transporte de IA também bloqueia chamadas com `APP_ENV=staging` mesmo que alguém ligue a flag por engano.

## 5. Aceite remoto obrigatório e entrega do link

Antes de entregar uma URL como funcional, abrir o domínio HTTPS efetivamente retornado pela Vercel em computador e viewport móvel. Validar:

1. Cadastro permitido/negado pelo Auth, confirmação de e-mail, login, logout e recuperação, callbacks na origem exata.
2. Duas empresas/usuários, criação de agentes e tentativa de ler/alterar fontes/conversas/downloads da outra empresa, inclusive por API anônima/autenticada.
3. PDF textual e PDF digitalizado de teste, opt-in OCR, fila passando a concluída, página/versão/citação corretas e download original idêntico.
4. Pergunta com resposta e sem resposta, fontes divergentes, histórico e relatórios PDF/CSV.
5. Reinício do worker, retomada da fila e isolamento dos logs/segredos.
6. Limite de arquivo e cota, nenhuma chamada de IA paga, nenhum pagamento e nenhum dado privado publicado.

As suítes Playwright atuais são deliberadamente locais: não apontá-las para produção nem remover as travas. A validação remota precisa de contas/dados descartáveis próprios e configuração específica antes de automatizar. Registrar evidências reais em TESTING.md. Não confundir build/testes locais com homologação Vercel/Supabase.

## O que o testador poderá experimentar após esse aceite

Cadastro/login, organizações/perfis, agentes, documentos e OCR via fila, perguntas **documentais/extrativas** com fontes, histórico e relatórios. Não são LLM externo homologado. Crawler público segue sem validação positiva neste ambiente; sincronização agendada ainda falta. Mercado Pago tem somente ledger sandbox/contratos, sem checkout ou cobrança funcional. Conectores, automações, WhatsApp oficial, white label e enterprise ainda exigem desenvolvimento.

Para a VM gratuita candidata Oracle/ARM, consulte [deploy/oci/README.md](../deploy/oci/README.md). A oferta e a capacidade precisam ser confirmadas na conta; não há VM criada.
