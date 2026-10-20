# Worker SivirinIA — candidato Oracle Always Free

Status em 20/10/2026: preparação local, **nenhuma VM criada**. Uso de recursos gratuitos e publicação de homologação autorizados; gastos, upgrades e lançamento comercial não autorizados. Contas Vercel/Supabase já existem. Ainda faltam acesso autenticado a elas, projeto Supabase de testes e e-mails de testadores.

## Conclusão técnica e o que ainda falta confirmar

A configuração candidata é **VM.Standard.A1.Flex, ARM64, 1 OCPU, 6 GB de RAM, Ubuntu 24.04 e boot de 50 GB**, sem volumes extras ou serviços auxiliares. O worker tem um processo por fila/tarefa, limite de container de 2 GB, parser de 512 MB e OCR nativo limitado. Essa VM tem memória suficiente para o runtime proposto e margem para o sistema e build. CPU e latência de OCR precisam ser medidos nela. Não é garantia de capacidade ou gratuidade oferecida pela Oracle.

A referência conhecida do Always Free A1 é de 3.000 OCPU-horas e 18.000 GB-horas por mês, com até 200 GB de armazenamento de blocos/boot no total da conta. **Esses números não foram revalidados nesta sessão**: o proxy recusou CONNECT às páginas oficiais (403). Não criar recursos com base apenas neles. Uma VM de 1 OCPU/6 GB usa no máximo aproximadamente 744 OCPU-horas e 4.464 GB-horas em mês de 31 dias; o consumo de outros recursos da conta também conta. Conferir unidades, limites e selo Always Free atuais no console antes de criar.

A disponibilidade depende da região de origem, capacidade A1 e conta. Não foi consultada uma tenancy/região, não há capacidade reservada. Créditos temporários de trial **não comprovam** gratuidade permanente. A Oracle prevê recuperação de recursos ociosos; confirmar política vigente. Essa oferta não dá garantia de disponibilidade para operação comercial. Não gerar carga artificial para evitar recuperação.

Interromper a criação se o console exigir conta paga, PAYG, cobrança, recurso apenas com crédito promocional ou mostrar qualquer custo positivo. Não ativar upgrade, aumentar limites, usar Marketplace pago, suporte pago, NAT Gateway, load balancer, backups pagos, volumes extras ou IPv4/rede com preço não confirmado. Orçamentos/alertas não bloqueiam despesas e não substituem manter a conta gratuita e selecionar apenas recursos Always Free. Não escolher uma região alternativa sem verificar se a oferta se aplica nela.

## ARM: evidência concreta

O digest Node fixado no Dockerfile é um índice OCI multiarch; o registro retornou `linux/amd64` e `linux/arm64/v8`. O lockfile inclui pacotes nativos Linux ARM64 para esbuild e canvas GNU. Não há binário AMD64 copiado do host: `npm ci` roda dentro da imagem e apt resolve a arquitetura do Debian. O modelo português Tesseract é dado independente de CPU e tem SHA-256 fixado.

O índice pode ser reconsultado com `docker buildx imagetools inspect node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5`.

Isso confirma os artefatos necessários e o desenho portável, **não uma execução ARM concluída**. O ambiente atual é x86_64, sem emulador ARM registrado. Não instalar binfmt privilegiado apenas para anunciar compatibilidade. O teste nativo de aceite é obrigatório na A1:

```sh
cd /opt/sivirinia
sudo python3 scripts/check-worker-vm.py
```

Ele confirma arquitetura nativa e executa PDF textual/digitalizado de testes dentro da imagem, sem rede/root, verificando OCR português e páginas. Se falhar no ARM, manter OCR remoto desabilitado e registrar o problema; não publicar compatibilidade como validada.

## Comparação de opções

| Opção | Adequação ao worker atual | Limitações a confirmar |
| --- | --- | --- |
| Oracle A1 Always Free | Melhor candidata: ARM64 e RAM suficiente para 2 GB de container | Capacidade regional, termos atuais, possível recuperação por ociosidade, elegibilidade de todos os componentes |
| Micro AMD da Oracle, historicamente 1 GB | Não recomendada para este container de 2 GB e OCR | Duas VMs pequenas não somam memória para um único processo; swap não substitui RAM adequada |
| Google Cloud e2-micro gratuito, historicamente 1 GB | Também insuficiente para a configuração atual | Regiões elegíveis limitadas, faturamento/rede/IP e excessos a verificar; não ativar cobrança |
| Créditos/trials de outros provedores | Não representam worker gratuito persistente | Prazo/limites e possível migração para cobrança; não selecionar sob esta autorização |
| Computador existente com Docker/WSL2 | Fallback viável sem nova contratação de hospedagem | Ligado/conectado durante os testes; recursos e licença local aplicável; não fornece disponibilidade 24 h |

A comparação é técnica; as ofertas de terceiros não foram homologadas ou contratadas. Não foi confirmado um segundo provedor gratuito adequado para execução contínua desse worker.

## Contas e autorizações

1. Se ainda não existir, o titular cria pessoalmente uma conta Oracle Free Tier em https://signup.cloud.oracle.com/. Ler termos e exigência de cartão. Pode haver verificação/reserva temporária no cartão: não realizar essa etapa pelo agente e interromper se houver cobrança não autorizada. Não fazer upgrade para conta paga. A região de origem deve ser escolhida com cuidado.
2. No console, criar um compartimento de homologação e confirmar A1, boot, rede, endereços, métricas e demais opções como gratuitos na conta. Não existe acesso OCI autenticado neste ambiente. Não enviar senha, cartão ou chave privada ao chat. O titular pode criar a VM no console; não é obrigatório fornecer chave administrativa OCI ao agente.
3. Gerar chave SSH no computador do titular e fornecer somente a chave pública ao console. Manter a privada local/protegida. Para acesso do operador, usar um canal seguro de SSH com usuário administrativo da VM, sem credencial de administrador da tenancy. Não criar dynamic groups/instance principals: o worker não precisa acessar APIs OCI.
4. Vercel: requisito seguro VERCEL_TOKEN já preparado para api.vercel.com; aplicar pelo gerenciador de segredos do ambiente. Autorizar GitHub somente para SivirinIA se necessário. Supabase: criar projeto de testes separado, configurar variáveis e migrations conforme docs/STAGING.md. Não usar credenciais de produção nem postgres/service_role no worker.
5. A lista de e-mails autorizados ainda precisa ser fornecida para ativar o hook de cadastro antes de liberar o site.

## Rede e segurança antes de criar a VM

Usar subnet com saída para HTTPS e PostgreSQL 5432 (direto ou pooler de sessão). Caso seja necessário endereço público para saída/administração, confirmar explicitamente que ele e o tráfego estão incluídos gratuitamente. Se não estiverem, parar; não criar NAT pago para contornar. Não há serviço web ou endpoint do worker para publicar.

Security list/NSG: substituir SSH aberto padrão por TCP 22 **somente do IP do administrador /32** (ou /128 se IPv6), sem 0.0.0.0/0 ou ::/0. Não abrir 80, 443, 3000, 5432, 2375 ou portas OCR na VM. Não expor socket Docker TCP. Senhas SSH e login root são desabilitados pelo cloud-init. Manter saída DNS, sincronização de horário e atualizações necessárias; não relaxar TLS ou SSRF do código. Uma VM com IP público não implica expor o worker: o Compose não publica portas.

O serviço instala regra específica na cadeia Docker DOCKER-USER que bloqueia HTTP de containers para metadata OCI 169.254.169.254:80, preservando DNS na porta 53 e demais regras. Falha se a cadeia iptables não existir; não desativar firewall. Essa regra e a integração systemd ainda precisam ser verificadas no Ubuntu da VM; não são sandbox integral para arquivos hostis. Usar somente documentos sintéticos de homologação.

## Implantação após confirmar recursos gratuitos no console

No formulário da VM nova Ubuntu 24.04, usar `cloud-init.yaml` como inicialização. O arquivo instala somente ferramentas no host; não cria recursos OCI, não contém segredos e não inicia ingestão automaticamente.

Na VM, por SSH:

```sh
sudo cloud-init status --wait
sudo docker version
sudo docker compose version
sudo git clone https://github.com/rogerio-moraes3/SivirinIA.git /opt/sivirinia
```

Se o repositório for privado, usar uma chave de deploy GitHub **somente leitura**, pelo SSH seguro do titular. Não inserir PAT em URL nem tornar o repositório público para viabilizar o clone. Se `/opt/sivirinia` já contiver checkout, preservá-lo e atualizar sem reset/force. Clonar a branch main existente e registrar o SHA; não executar automaticamente código novo a cada push.

Criar `/etc/sivirinia/worker.env` root-owned 0600 com o projeto de testes e a conexão do papel **sivirinia_worker**. Seguir `deploy/worker.env.example`. O banco concede somente as funções restritas da fila. Não copiar .local/worker.env de desenvolvimento nem colocar senha na linha de comando/histórico. Usar editor seguro/gerenciador de segredos, sem imprimir o arquivo em logs. O operador administrativo configura o papel conforme STAGING.md; a credencial administrativa não permanece na VM.

Compose monta por padrão o bundle público de CAs do Ubuntu como somente leitura e exige validação de certificado/hostname no PostgreSQL remoto. Se o Supabase exigir CA própria, baixar a CA pelo dashboard e salvar `/etc/sivirinia/supabase-ca.crt`; em `/etc/sivirinia/host.env` (0600), definir `WORKER_CA_HOST_FILE=/etc/sivirinia/supabase-ca.crt`. Esse arquivo contém caminho, não credencial. Não ignorar erros de certificado.

```sh
cd /opt/sivirinia
sudo docker compose -f deploy/worker.compose.yml config --quiet
sudo docker compose -f deploy/worker.compose.yml build
sudo python3 scripts/check-worker-vm.py
sudo install -m 0644 deploy/oci/sivirinia-worker.service /etc/systemd/system/sivirinia-worker.service
sudo systemd-analyze verify /etc/systemd/system/sivirinia-worker.service
sudo systemctl daemon-reload
sudo systemctl enable --now sivirinia-worker
sudo docker compose -f deploy/worker.compose.yml logs --tail 30 worker
```

O nome da imagem no Compose é `sivirinia-worker:staging`, o mesmo dos testes. O host não precisa de Node: ele fica na imagem Docker; o teste usa Python 3 padrão do Ubuntu. Não transportar uma imagem AMD64 já construída para A1: construir nativamente nela. Build pode exigir espaço temporário; verificar disco antes e depois, sem criar volume pago. Rotação de logs e limite de RAM/PIDs já estão no Compose. O build pela rede OCI não precisa do proxy privado do ambiente Codex.

A fila, originais e versões ficam no Supabase de testes, não no disco efêmero do worker. Isso não é uma política de backup validada do Supabase. Se a VM for recuperada/perdida, reinstalar e revogar/rotacionar o login restrito caso necessário; tarefas são retomadas por lease. Verificar reinício e retomada de fila. Não copiar documentos/segredos para backup público.

## Aceite e continuidade

Validar regra metadata, SSH restrito, ausência de portas publicadas, TLS válido, papel restrito, OCR nativo ARM e upload/consulta/relatórios no domínio real conforme docs/STAGING.md. Registrar evidências sem segredos. Manter IA paga e cobranças desligadas. O frontend/Supabase podem continuar sendo configurados enquanto se avalia a VM; se houver publicação parcial, sinalizar claramente que processamento está indisponível até ligar um worker. Não entregar fila pendente como OCR funcionando.

Se A1 não estiver disponível ou exigir gasto, usar a mesma imagem no computador do titular com Docker/WSL2 e WORKER_ENV_FILE apontando para arquivo local protegido. O worker só funciona enquanto o computador estiver ligado. Não expor portas locais. Essa decisão não exige reescrever o frontend ou a fila.

## Fontes oficiais a reconsultar

- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://www.oracle.com/cloud/free/faq/
- https://cloud.google.com/free/docs/free-cloud-features

Nesta sessão, todas as consultas acima falharam no CONNECT do proxy (403), antes de resposta dos sites. Não afirmar preços/condições atuais como confirmados. Destinos foram adicionados ao rascunho de rede do ambiente para revisão/aplicação; é necessário aplicar e repetir a consulta. A capacidade da região só é verificável na conta Oracle, mesmo com documentação acessível.
