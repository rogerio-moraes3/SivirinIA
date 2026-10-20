# Testes e evidências locais

## Última validação

- ESLint: passou, sem erros ou avisos.
- TypeScript e geração de tipos de rotas: passaram.
- Vitest: **79 testes passaram em 10 arquivos**.
- PostgreSQL real: **136 asserções passaram** — 53 de isolamento/permissões/cotas/convites/citações/exclusão; 23 de publicação restrita/revogação e 50 da fila/recuperação lexical, originais, snapshots, ACL, leases, cancelamento e limites; 10 da manutenção incremental de fragmentos.
- Build de produção Next.js: passou.
- Playwright/Chromium na aplicação compilada: **6 jornadas aprovadas**: cinco na execução geral e a sexta em reexecução focada após corrigir seletores ambíguos. Nenhum teste foi marcado como ignorado.
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
