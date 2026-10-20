# Testes e evidências locais

## Última validação

- ESLint: passou, sem erros ou avisos.
- TypeScript e geração de tipos de rotas: passaram.
- Vitest: **107 testes passaram em 14 arquivos**.
- PostgreSQL real: **168 asserções passaram** — 53 de isolamento/permissões, 23 de publicação, 50 da fila/recuperação, 10 de índices incrementais, 11 de OCR/reprocessamento, 4 de busca híbrida e 17 de billing sandbox.
- Build de produção Next.js: passou.
- Playwright/Chromium na aplicação compilada: **7 jornadas passaram juntas**, sem testes ignorados; agora inclui OCR e reprocessamento do original. A regressão específica de PDF/URL foi repetida após adicionar prazos de DNS/HTTPS.
- Auditoria das dependências de produção: **0 vulnerabilidades reportadas**.

## Jornadas de navegador executadas

1. Site comercial, navegação, proteção de rotas e ausência de overflow mobile.
2. Cadastro, organização, agente, texto, duplicação, duas perguntas na mesma conversa, citações reais, histórico, feedback, inteligência, recusa sem evidência, exclusão de fonte e logout.
3. Upload de PDF real com duas páginas, preservação de página, atualização/reindexação, registro de versões e bloqueio de URL interna.
4. Incorporação do widget em um segundo servidor HTTP real, de origem diferente, consulta anônima, recusa a dados de fonte privada e revogação do link.
5. Recuperação de senha com mensagem realmente capturada no SMTP local, verificação do link, callback, redefinição, rejeição da senha antiga e login com a nova.
6. PDF corrompido: falha visível, descarte do original pendente, nova ingestão válida; download anônimo recusado; agente privado recusa fonte fora da whitelist e responde com a fonte autorizada.

A jornada 2 também valida PDF privado real, cabeçalhos no-store, filtro de período vazio, CSV filtrado e rejeição de data impossível.

O teste do widget não é uma validação de WordPress. O host de teste é um servidor HTTP Node mínimo; o app, Auth, API, banco, pesquisa e permissões são reais. Não foram desabilitados CORS, proteção de acesso a redes privadas ou verificação TLS para fazê-lo passar. Chromium roda sem seu sandbox nativo apenas no ambiente de testes isolado da nuvem.

## Segurança e contratos

SQL: papéis reais anon/authenticated, identidade por claims, RLS de tabelas e view, separação de empresas, conversa privada, ACL de fonte, quota derivada do conteúdo, reserva mensal, rejeição de citações inventadas, convites por e-mail confirmado/uso único, autorização de funções, tokens não expostos, whitelist pública, rotação e revogação.

Unitários: extração de PDF/DOCX reais, fragmentação, hash, limites, HTML sem scripts, redes especiais IPv4/IPv6, validação de URL, ausência de evidência, citações, contratos simulados de IA, bloqueio de chamadas pagas quando desativadas, CSV e relatórios determinísticos. Casos de callback cobrem o endereço interno 0.0.0.0 e rejeição de hosts/configurações não confiáveis.

O pipeline de IA com fornecedor real **não foi executado**: não há credencial nem autorização de custo. Testes de contrato usam simuladores identificados somente em tests/. A busca documental validada não equivale a geração por IA validada.

## Correções encontradas na validação

- Overflow de uma órbita decorativa no celular.
- Nome acessível do campo senha, antes contaminado pelo texto auxiliar.
- Agente ausente no envio da segunda pergunta porque o select era desabilitado; o identificador agora tem campo oculto próprio.
- Redirecionamento do callback para o bind interno 0.0.0.0; agora a origem pública é configurada/validada.
- Testes usam a versão compilada, uma instância Next por vez e um host HTTP real para o widget, evitando interferência de overlay/HMR e classificação artificial de rede das respostas interceptadas.

## Limites da evidência

Não foram executados: chamadas reais de IA/embeddings, importação positiva de site nesta rede, pagamentos, conectores, WhatsApp, testes de carga/pentest, auditoria jurídica, recuperação de backup, deploy externo ou restauração em uma tarefa nova. CI foi configurado e houve push; consulta de execuções do GitHub Actions recebeu HTTP 403. O resultado remoto não foi verificado.

Fixtures SQL são revertidas. Jornadas de navegador mantêm contas/organizações identificadas como testes na instância local, isoladas de novas contas por RLS.

## Reprodutibilidade do ambiente

`bash scripts/install.sh` foi executado integralmente com npm ci e pull das quatro imagens fixadas. O starter foi repetido preservando configuração/dados, e o gateway foi encerrado e reativado pelo próprio starter. As 76 asserções SQL passaram após recriar os containers.

`npm run test:cold-start` também passou: outro projeto Compose, volume vazio, bootstrap do zero, migrations atuais, GoTrue real, sessão JWT, organização, agente, indexação e busca autenticada. O projeto/volume temporário foi removido, preservando o runtime principal. Isso valida instalação limpa local, não restauração de snapshot em uma tarefa nova.

## Ingestão assíncrona

Os cinco E2E passaram novamente com worker restrito e parser em processo filho reais. PDF: download byte a byte igual ao arquivo enviado, atualização por fila e leitura integral da versão anterior. Unitários exercitam PDF/DOCX/texto no processo separado, arquivo inválido, timeout e classificação segura de erros. SQL adicional exercita lease expirado/retomado, permissão revogada, alteração concorrente, cota de armazenamento e exclusão em cascata. Cold-start passou com as migrations atuais (a mensagem antiga do script ainda mencionava 9 migrations).

## Busca e relatórios

Avaliação documental com banco real: 12/12 casos em português, fixtures sintéticas revertidas, sem IA externa. Quatro recusas indevidas foram identificadas e corrigidas, sem mudar as respostas esperadas. Não é avaliação semântica de LLM.

Testes novos: histórico de perguntas limitado no contrato de IA (simulador), preservação de IDs/embeddings de fragmentos inalterados no PostgreSQL, invalidação de vetores de texto alterado, datas inválidas/limites de período em São Paulo e PDF real com texto extraível/acentos/custos desconhecidos. O prazo do teste de subprocesso PDF foi ajustado para 15 s por incluir inicialização real do parser; o prazo operacional continua 60 s. Detectamos e corrigimos uma comparação de vector que dependia indevidamente do search_path.

A suíte de navegador foi ampliada para validar escopo do agente privado, rejeição de PDF corrompido, descarte/continuidade e bloqueio de download anônimo. Durante a ampliação, um seletor de teste encontrou checkboxes homônimos nos formulários de fontes internas e públicas; o teste foi delimitado ao formulário correto. Resultado: a execução geral passou nas cinco jornadas anteriores (incluindo PDF/CSV/período); a sexta passou na reexecução focada após delimitar também a mensagem de sucesso ao formulário correto. Nenhuma alteração no comportamento da aplicação foi necessária para esses dois ajustes de seletor.

## OCR em português

Sete testes OCR com ferramentas/modelo reais passaram (PDF digitalizado, PDF misto, PNG, DOCX com imagem, limites e limpeza). Oito novas asserções SQL: opt-in, autorização, metadados e falhas. As sete jornadas E2E passaram juntas, incluindo upload digitalizado via fila, download idêntico ao PDF original e pergunta citada na página reconhecida. Lint, TypeScript e build passaram. Modelo oficial baixado/verificado; nenhuma chamada a OCR externo.

## Últimas extensões

Avaliação documental ampliada: 20/20 casos sintéticos, incluindo tabela de alçadas, retenção/exclusão de dados, perguntas ausentes e duas fontes com prazos divergentes. Não mede precisão semântica de modelo externo. Tarifas ausentes, excesso de tokens/custo e fontes divergentes bloqueiam chamadas conforme os contratos testados; nenhuma chamada paga executada.

Crawler: contratos de BFS/sitemap, XML/DTD/XXE, origem/redirecionamento, limites, diferença de versões e DNS que não responde. Transporte simulado somente nos testes. CLI público real falhou com zero páginas, sem substituir sucesso anterior nem autorizar exclusão. Não houve importação positiva pública.

Billing: ledger em PostgreSQL real com RLS, preço do catálogo, idempotência, rejeição de valor incompatível, regressões de eventos e não ativação de plano por sandbox. Três testes locais de assinatura/adaptador; não são homologação Mercado Pago. Sem checkout/receptor de webhook conectado.

## Preparação de homologação — 2026-10-20

Passaram localmente: lint, TypeScript, 123 unitários em 15 arquivos; 174 asserções SQL (seis novas para hook/lista de testadores), cold-start com volume vazio e as sete jornadas Playwright juntas (3,1 min). O runner fez build e executou Next compilado com Auth/PostgreSQL/worker reais. Inclui layout móvel, cadastro/login, organizações/agentes, PDF, ACL de fontes, download privado, widget/revogação, recuperação de senha, relatórios e OCR via fila. Após padronizar o nome de variável pública com a aplicação e revisar TLS, lint/types e os 16 contratos novos passaram novamente.

Falhas intermediárias corrigidas: tipo ProcessEnv exigia NODE_ENV nos testes; helper SQL não tinha permissão na tabela temporária do teste sob o papel Auth; primeira tentativa E2E encontrou o Next dev já em execução, encerrado após identificar o processo deste checkout. Não foram reduzidas proteções/assertions para passar testes.

Sem evidência remota: nenhum deploy Vercel, migrations gerenciadas, SMTP remoto, navegador contra domínio público ou RLS contra Supabase gerenciado executados. O preflight valida configuração, não autentica a chave nem prova isolamento remoto. Ver checklist STAGING.md antes da publicação.

Worker Docker: build passou com CA corporativa via BuildKit secret, sem gravar CA/segredos na imagem. `node scripts/check-worker-image.mjs` passou em PDF textual e PDF digitalizado real de testes, com rede desligada, usuário não root, filesystem somente leitura, RAM/PIDs limitados e páginas/conteúdo OCR verificados. A primeira execução detectou fontes de código com permissões 600 herdadas; a imagem agora define leitura nos arquivos não secretos antes de mudar para o usuário node. Comando real do container `npm run worker -- --once` conectou ao banco local com sivirinia_worker e encerrou corretamente. Isso ainda não comprova TLS/conectividade num Supabase gerenciado.
