# Acessos para executar a homologação autorizada

Em 20/10/2026, o usuário autorizou a publicação de homologação sem custos e sem lançamento comercial. Informou ter contas Vercel e Supabase e não ter host Linux/servidor persistente para o worker. Não pedir autorização de publicação novamente. Isso não fornece uma sessão autenticada às plataformas.

## Vercel

1. Acessar https://vercel.com/account/tokens na conta/equipe que hospedará apenas a homologação. Criar token com prazo curto e o menor escopo disponível. Se o escopo não for aceitável, usar o painel manualmente, sem fornecer token.
2. No gerenciador de segredos das configurações deste ambiente Codex, configurar o requisito `VERCEL_TOKEN`, destinado somente a `api.vercel.com`. Não colocar o token no chat, Git, variável NEXT_PUBLIC ou arquivo de exemplo.
3. Revisar/salvar a configuração e aplicar a atualização do ambiente. O agente deve revalidar uma operação de leitura autenticada antes de afirmar que tem acesso. O rascunho não efetua login nem deploy.
4. Se a integração GitHub for necessária, autorizar a instalação Vercel somente para `rogerio-moraes3/SivirinIA`. O acesso Git do Codex já funciona; não precisamos de um novo PAT GitHub.
5. Não clicar em Deploy com configuração incompleta. Não fornecer dados de cobrança ou contratar Pro. Verificar elegibilidade do plano gratuito para esta homologação; se exigir pagamento, avaliar outra hospedagem antes de prosseguir.

## Supabase

1. Acessar https://supabase.com/dashboard e criar/selecionar um projeto Free vazio, exclusivo de homologação. Sugerir nome `sivirinia-homologacao`; isso é nome sugerido, não um recurso ou URL já existente. Não habilitar extras pagos ou upgrades.
2. Informar apenas a referência/nome do projeto ao agente. Configurar a URL e chave pública de testes conforme `deploy/frontend.env.example` na Vercel, separadas das configurações locais. Não substituir `.env.local` do desenvolvimento nem compartilhar sessão de produção.
3. Aplicar migrations com o comando seguro de STAGING.md, num operador confiável. A conexão administrativa precisa ficar no gerenciador de segredos desse operador; não é proxy HTTPS e não deve ser configurada como token de API Vercel. Sem essa conexão, as migrations ainda não estão executáveis pelo agente. Alternativamente, um operador com acesso ao dashboard pode executar as migrations revisadas e registrar os hashes, com acompanhamento do agente.
4. Ativar o hook de cadastro descrito em STAGING.md e inserir apenas e-mails dos testadores autorizados. A lista de e-mails ainda não foi fornecida; não inventar contas autorizadas.
5. Configurar e testar confirmação de e-mail/SMTP, Site URL e callbacks exatos após definir o domínio real. Não abrir o cadastro para contornar um problema de hook/SMTP.

## Worker: decisão ainda pendente

| Alternativa | Custo/condição | Limitação |
| --- | --- | --- |
| Computador existente com Docker, Linux ou WSL2 | Sem nova contratação de hospedagem; sujeito aos recursos e licença aplicável da máquina/software | Processa somente enquanto ligado e conectado; não é disponibilidade 24 h |
| VM em oferta/cota gratuita de provedor | Precisa confirmar oferta vigente, capacidade, cartão, política de desligamento e bloqueio de cobrança | Não há vaga, gratuidade permanente ou ausência de cobrança garantidas; não criar sem validar condições |
| Frontend online, worker desligado | Sem contratar host de processamento | Uploads ficam na fila; não atende aceite completo de PDFs/OCR |

Não foi escolhido ou ativado provedor gratuito de VM. Este ambiente Codex é temporário e não serve como host permanente. Cron/funções Vercel não substituem o worker Node/Tesseract existente. Não usar minutos GitHub Actions como serviço contínuo de processamento de clientes. O usuário precisa escolher entre disponibilidade limitada numa máquina existente e a avaliação de uma oferta gratuita de VM. Se nenhuma opção atender, informar antes de propor gasto.

## Critério de conclusão

Acesso às contas, projeto separado, e-mails de teste e host do worker continuam pré-requisitos. Só depois de deploy confirmado e dos testes remotos de STAGING.md fornecer o domínio real como funcional. Ainda não há URL pública confirmada, migração remota aplicada ou testes pós-publicação nesta etapa.

## Decisão posterior: avaliar Oracle primeiro

O usuário escolheu avaliar Always Free, sem gastos, upgrades ou cobrança automática. Guia técnico, condições de criação e fallback em [deploy/oci/README.md](../deploy/oci/README.md). A autorização de recursos gratuitos já existe; não pedir aprovação genérica novamente. Continua necessário verificar oferta real e capacidade na conta/região e conectar os acessos. Nenhum serviço foi criado.
