# Custos

Nesta implementação não foram contratados serviços, provisionados projetos pagos, ativadas APIs pagas nem publicado deploy. Foram usados processos Docker locais, bibliotecas abertas e pacotes dos registros oficiais.

Custos possíveis de operação: hospedagem, Supabase gerenciado, banco/armazenamento/egresso, geração e embeddings, OCR, crawler, filas, e-mail transacional, observabilidade, gateway e emissão fiscal. Planos gratuitos têm limites e podem não permitir todos os usos comerciais; verificar termos antes do lançamento.

Os valores dos PDFs são hipóteses, não cotações atuais. Não há estimativa financeira verificada nesta versão. Fórmula de geração: (tokens_entrada × tarifa_entrada + tokens_saída × tarifa_saída) / 1.000.000. Sem tarifas configuradas, o custo permanece desconhecido/nulo. Nunca apresentar desconhecido como zero.

Controles atuais: IA desligada explicitamente; modelo configurável; máximo de 1.000 tokens de saída por geração; pergunta limitada a 2.000 caracteres; no máximo oito trechos; cotas no banco; limite de perguntas e admissões de ingestão por minuto; uma ingestão simultânea por tenant.

Antes de produção: metering de embeddings, teto monetário, armazenamento, tarefas, distribuição de custo e alertas. As cotas atuais não substituem orçamento financeiro do provedor nem proteção contra abuso por muitas contas gratuitas.
