# Conhecimento e IA

Pipeline atual: autenticar → autorizar tenant → reservar cota → embedding opcional → busca textual/vetorial → trechos autorizados → geração opcional → validar referências → salvar resposta/uso → exibir citações.

Extração: PDF com página, DOCX com parágrafos/tabelas, TXT/MD/CSV/HTML e URL HTTPS. Hash normalizado impede duplicação. Fragmentos de até 1.400 caracteres, sobreposição de 180. Essa fragmentação é determinística; não é segmentação semântica avançada.

Busca: normalização determinística de perguntas em português remove verbos/atributos genéricos (como funciona/exige/prazo/horário), preservando frases entre aspas e operadores explícitos. Não é compreensão semântica. A consulta é limitada às fontes permitidas do agente e à ACL atual do usuário. Base: websearch_to_tsquery português + ts_rank_cd; com embeddings de dimensão 1536, soma de pontuação lexical e similaridade de cosseno positiva. Candidatos sem correspondência lexical precisam de similaridade >0,35. O limiar é inicial e precisa de avaliação em corpus real. Até oito trechos por consulta; modo extrativo exibe até quatro.

Sem evidência: recusa explícita e nenhuma chamada ao modelo. Sem chave/ativação: modo documental. Geração opcional envia pergunta, preferências e trechos como dados em mensagem de usuário; instruções de segurança ficam na mensagem de sistema. Sem acesso a ferramentas.

Citações são construídas da base, nunca do texto do modelo. Índices citados são validados. O banco confere fragmento, fonte, texto, página, título e versão antes de aceitar persistência. Isso impede referência inventada, mas não garante que toda frase da síntese seja sustentada. Avaliação de entailment/contradição e conjunto de 50–100 perguntas curado por especialista são pendentes.

Custos registrados são da geração quando tarifas estão configuradas. Embeddings têm lotes de 32, sem paralelismo irrestrito. Metering financeiro completo, resumos e reformulação contextual da busca não estão implementados. Geração recebe até quatro perguntas anteriores (1.000 caracteres cada) como dados não confiáveis, nunca respostas antigas como evidência. Esse contrato foi testado com simulador, sem validação de modelo externo.

## Avaliação reproduzível

`npm run eval:rag` executa busca real no PostgreSQL com papéis, claims de sessão e RLS e respostas extrativas sobre corpus sintético de teste em português (`tests/fixtures/rag-ptbr.json`). As fixtures são revertidas por rollback. Não é mock de banco nem validação de LLM. O comando força IA desligada no próprio processo, mesmo se a aplicação tiver uma chave habilitada.

Os 12 casos cobrem tópicos documentados, citações/página/versão, termos esperados e recusas de assuntos ausentes. A primeira execução passou 8/12; após correção da normalização, 12/12. Relatório privado em `.local/rag-evaluation.json`, incluindo precisão/recall de recuperação por fonte, integridade das citações, acerto de recusa, presença de termos e latência observada. São métricas de um corpus pequeno/sintético; não comprovam qualidade semântica, segurança contra toda prompt injection ou precisão em produção.

Preparação para avaliação externa: `npm run eval:rag -- --provider` exige AI_EVAL_ALLOW_PAID=true, AI_ENABLED=true, credencial e modelo configurados por canal seguro, além da autorização de custos do proprietário. Esse modo não foi executado. Medição de custo cobre geração quando há tarifas, sem custo completo dos embeddings. Não habilitar os flags sem autorização.
