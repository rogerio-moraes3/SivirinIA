# Bloqueios e requisitos restantes

## IA externa

Não há AI_API_KEY/modelos autorizados no ambiente, e nenhuma chamada paga foi realizada. O módulo gerador e o adaptador de embeddings estão implementados, com contratos simulados em testes. A busca documental funciona sem eles.

Para ativação futura:
1. O proprietário escolhe um provedor/modelo e autoriza o orçamento.
2. Criar/usar credencial própria no painel oficial do provedor. Não enviar a chave em chat nem versioná-la.
3. Cadastrar AI_API_KEY nas configurações seguras do ambiente, com destino api.openai.com, e selecionar AI_CHAT_MODEL/AI_EMBEDDING_MODEL atuais. O embedding precisa aceitar dimensões=1536.
4. Habilitar AI_ENABLED=true somente com autorização de gasto; reiniciar o servidor e executar avaliação real. Documentos anteriores precisam de reindexação para ganhar embeddings.

## Importação por URL

O DNS nativo desta nuvem retorna EAI_AGAIN para domínios públicos. Pacotes e destinos permitidos são acessíveis pelo proxy HTTPS, mas isso não substitui a validação DNS/IP exigida pelo crawler. Não desabilitar TLS, pinning ou bloqueio de redes privadas. É necessário validar um transporte de proxy com as mesmas garantias ou usar um ambiente com resolução/egresso público direto controlado. Arquivos e texto continuam funcionais.

## Logo original

A imagem oficial foi recebida visualmente, mas não há arquivo binário baixável da logo entre os anexos disponíveis nem no checkout. Quando o PNG/SVG original estiver disponível, adicioná-lo a public/ e configurar lib/brand.ts. O monograma atual não é a logo original.

## Antes de produção

O runtime Compose é de desenvolvimento, com captura local de e-mail e confirmação automática de contas para testes. Não expor como instalação comercial. Para hospedagem autorizada, usar infraestrutura/fornecedores revisados, APP_URL HTTPS correto, confirmação de e-mail, SMTP, Storage privado, workers isolados, backups/restore, monitoramento, limites financeiros, retenção/exclusão e revisão especializada.

Não declarar conformidade integral LGPD, residência no Brasil ou precisão garantida da IA. Novos arquivos/textos preservam originais e versões integrais. Importações antigas/URLs não têm snapshot retroativo. Storage usa PostgreSQL privado limitado, ainda sem backend de objetos gerenciado ou varredura antimalware.

## Módulos futuros

Cobrança, conectores, WhatsApp, automações, API comercial e enterprise não estão concluídos aguardando somente uma chave: ainda exigem desenvolvimento, contratos oficiais e testes. Solicitar configurações específicas apenas quando o módulo estiver preparado para validação.

## OCR

Implementado e validado localmente com modelo português oficial. Outras máquinas precisam executar npm run ocr:install e instalar as ferramentas nativas; detalhes em OCR.md. Ainda faltam corpus adversarial amplo, reconstrução semântica de tabelas e sandbox completa.

## CI remoto

Push para main funcionou. A leitura de execuções do GitHub Actions via gh/API retornou HTTP 403. Os resultados locais são verificáveis; não foi confirmado o resultado do CI remoto.

Tentativas adicionais de rede nesta continuação: DNS-over-HTTPS Cloudflare e documentação oficial Mercado Pago retornaram HTTP 403. Nenhuma proteção de DNS, TLS ou SSRF foi removida. Homologação externa de billing continua pendente.

## Homologação online

Não foi encontrada URL pública de preview nem vínculo `.vercel`, credenciais de deploy ou projeto gerenciado de testes configurado. Publicação continua dependendo da autorização explícita pedida pelo usuário. Precisamos das contas/projeto de testes, host persistente do worker e e-mails autorizados; segredos devem ser definidos nos gerenciadores das plataformas, nunca no chat. Supabase gratuito/SMTP e Vercel precisam de verificação de limites/elegibilidade antes de criação. Não prometer servidor worker gratuito permanente.

Leitura do schema oficial `openapi.vercel.sh/vercel.json` retornou HTTP 403; a validação final da configuração pela Vercel ainda está pendente. Build Docker inicialmente falhou por DNS do repositório Debian/proxy; resolver o proxy explicitamente e usar CA de build via secret preserva validação TLS e assinatura apt. Build e testes da imagem concluídos localmente, incluindo OCR sem rede/root e conexão restrita ao banco local. Ainda falta executar no host persistente com Supabase gerenciado.

### Atualização após autorização

Publicação de homologação está autorizada desde 20/10/2026; não falta mais aprovação de deploy. As contas existem, mas as sessões/acessos ainda não estão disponíveis neste ambiente. Usuário não tem servidor persistente: escolha de worker gratuito permanece pendente. Ver STAGING_ACCESS.md. Não confundir cadastro de requisito VERCEL_TOKEN no rascunho com token configurado ou conta conectada.

### Oracle escolhida para avaliação

Ainda não há acesso a uma tenancy/região OCI. Consultas oficiais docs.oracle.com/www.oracle.com/cloud.google.com foram bloqueadas pelo proxy no CONNECT 403. Domínios foram incluídos no rascunho, sem comprovar aplicação ao runtime. Não confirmar limites vigentes/Always Free/capacidade por memória de documentação histórica. O console precisa confirmar conta gratuita, selo Always Free de compute/boot e custo zero de rede/endereço/opções antes de criar.

Imagem base suporta ARM64 no índice e dependências nativas existem no lockfile, mas host é x86_64 sem emulador: falta aceite ARM real. Templates cloud-init/systemd/firewall preparados e ainda não inicializados numa VM. Systemd-analyze no host atual não valida docker.service/caminho /usr/bin/docker ausentes nele. Alternativa local Docker/WSL2 continua viável enquanto houver computador ligado.
