# Integrações

## Operacionais localmente

Supabase Auth/PostgreSQL/pgvector/PostgREST foram validados localmente com SQL real e jornadas de navegador. Parser e persistência usam bibliotecas abertas. O importador de página HTTPS foi implementado com proteção SSRF, mas a rede atual não oferece resolução DNS direta (EAI_AGAIN); o fluxo de URL permanece bloqueado nesta máquina. Não contornar fixação de IP ou validação TLS para passar o teste.

## Adaptador implementado, ativação externa pendente

OpenAI: embeddings dimension=1536 e chat completions. Não há modelo default para evitar fixar disponibilidade/preço não verificados. `AI_ENABLED` é falso por padrão. Testes unitários do contrato usam simulador exclusivamente no ambiente de testes. Aceite real depende de credencial, modelo autorizado, orçamento e avaliação documental.

## Ainda não implementadas

Anthropic; Google Drive/Docs; Notion; SharePoint/OneDrive; Confluence; GitHub; Zendesk; Movidesk; Omie; Bling; Conta Azul; RD Station; Tiny; Hotmart; Kiwify; WhatsApp Business; MCP; CRM/ERP e webhooks de ações.

Para cada conector: implementar OAuth/escopos oficiais, credencial protegida, importação incremental, remoção/revogação, paginação, backoff, logs e teste real com uma conta autorizada. Não pedir todos os segredos de uma vez nem listar um conector como pronto por possuir um formulário.
