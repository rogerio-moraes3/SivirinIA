# Planos e cobrança

Operacional localmente: catálogo configurável, plano gratuito, cotas transacionais de agentes/páginas/respostas e painel de consumo. Não existe cobrança ativa.

## Fundação de sandbox implementada

- Intenções de pagamento têm referência UUID emitida pelo servidor, preço capturado do catálogo, moeda BRL e ambiente fixo sandbox. Somente o proprietário cria; proprietário/administrador leem o próprio tenant.
- Ledger de eventos com idempotência, correspondência de intenção/valor/moeda/pagamento, lock transacional e proteção contra regressão de aprovação/reembolso por eventos atrasados.
- Papel de reconciliador separado, sem login provisionado e sem leitura ampla de tabelas. Usuários não aprovam pagamentos por RPC nem inserem eventos.
- Aprovação sandbox **nunca** altera plan_id ou concede plano comercial. O painel exibe registros reais dessas tabelas como testes; não há registros financeiros semeados na aplicação.
- Adaptador Mercado Pago somente de leitura GET /v1/payments/:id. Exige MP_SANDBOX_ENABLED=true e token TEST-, recusa token de produção e respostas live_mode=true; retorna somente referência, valor, moeda e estado.
- Verificador HMAC-SHA256 com comparação constante, IDs vinculados à assinatura e janela temporal. Contrato unitário preparado, sem homologação com notificações reais do provedor.

## Limites e pendências

**Não há checkout, criação de pagamento Pix/cartão, endpoint receptor de webhook conectado ao ledger, assinatura recorrente, upgrade/downgrade, cancelamento no PSP, reconciliação agendada, faturas ou emissão fiscal implementados.** O domínio sandbox e os adaptadores não equivalem a integração Mercado Pago pronta.

Foram executados 17 testes de banco para o ledger e três contratos locais do adaptador/assinatura. Testes do provedor usam simulador claramente identificado; nenhuma conta Mercado Pago foi usada e nenhuma cobrança/chamada autenticada real foi realizada. A documentação oficial consultada nesta rede retornou HTTP 403; confirmar contrato vigente antes da homologação.

Próxima integração: permitir acesso à documentação oficial, preparar app/contas de teste e credenciais em gerenciador seguro; conectar criação de checkout/intenção e recepção durável de notificações assinadas. Sempre consultar estado autoritativo do PSP; nunca aplicar plano por status do navegador/webhook. Não presumir que Pix único, Pix recorrente e cartão usam a mesma operação. Proteger webhooks contra reentrega/perda e reconciliar divergências.

Credenciais futuras (não enviar em chat): MP_ACCESS_TOKEN de teste e MP_WEBHOOK_SECRET no processo servidor/reconciliador. Não cadastrar credencial de produção nesta implementação. Emissão fiscal exige módulo próprio e dados legais do operador.
