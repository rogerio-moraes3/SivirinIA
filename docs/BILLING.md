# Planos e cobrança

Implementado: catálogo configurável no banco, plano gratuito no bootstrap, cotas de agentes/páginas/consultas, limite mensal transacional e painel de consumo real. Nenhuma cobrança é executada.

Mercado Pago é o provedor prioritário do PRD. Ainda não existe checkout, recorrência, verificação de webhook, reconciliação, upgrade/downgrade, cancelamento, prorrata ou emissão fiscal. Planos pagos no site são explicitamente propostas em preparação, sem botões de compra.

Antes de ativar: consultar documentação oficial atual; separar Pix único, Pix recorrente e cartão; vincular pagamento a referência emitida pelo servidor; verificar assinatura e janela temporal; consultar estado autoritativo do PSP; aplicar idempotência; reconciliar perdas/duplicatas; somente então atualizar plano. Não confiar em organization_id ou status fornecido pelo navegador/webhook sem reconciliação.

Emissão NFS-e exige módulo fiscal independente e dados legais do operador. O gateway não é presumido emissor de nota.
