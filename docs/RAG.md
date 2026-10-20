# Conhecimento e IA

Pipeline atual: autenticar → autorizar tenant → reservar cota → embedding opcional → busca textual/vetorial → trechos autorizados → geração opcional → validar referências → salvar resposta/uso → exibir citações.

Extração: PDF com página, DOCX com parágrafos/tabelas, TXT/MD/CSV/HTML e URL HTTPS. Hash normalizado impede duplicação. Fragmentos de até 1.400 caracteres, sobreposição de 180. Essa fragmentação é determinística; não é segmentação semântica avançada.

Busca: websearch_to_tsquery português + ts_rank_cd; com embeddings de dimensão 1536, soma de pontuação lexical e similaridade de cosseno positiva. Candidatos sem correspondência lexical precisam de similaridade >0,35. O limiar é inicial e precisa de avaliação em corpus real. Até oito trechos por consulta; modo extrativo exibe até quatro.

Sem evidência: recusa explícita e nenhuma chamada ao modelo. Sem chave/ativação: modo documental. Geração opcional envia pergunta, preferências e trechos como dados em mensagem de usuário; instruções de segurança ficam na mensagem de sistema. Sem acesso a ferramentas.

Citações são construídas da base, nunca do texto do modelo. Índices citados são validados. O banco confere fragmento, fonte, texto, página, título e versão antes de aceitar persistência. Isso impede referência inventada, mas não garante que toda frase da síntese seja sustentada. Avaliação de entailment/contradição e conjunto de 50–100 perguntas curado por especialista são pendentes.

Custos registrados são da geração quando tarifas estão configuradas. Embeddings têm lotes de 32, sem paralelismo irrestrito. Metering financeiro completo, resumos e reformulação contextual não estão implementados.
