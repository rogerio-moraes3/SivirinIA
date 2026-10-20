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

Não declarar conformidade integral LGPD, residência no Brasil ou precisão garantida da IA. Originais e conteúdo integral das versões antigas ainda não são preservados; a interface explicita essa limitação.

## Módulos futuros

Cobrança, conectores, WhatsApp, automações, API comercial e enterprise não estão concluídos aguardando somente uma chave: ainda exigem desenvolvimento, contratos oficiais e testes. Solicitar configurações específicas apenas quando o módulo estiver preparado para validação.
