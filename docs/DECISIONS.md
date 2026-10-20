# Decisões

- Nome oficial: SivirinIA; configuração central em lib/brand.ts. Não usar nome provisório dos anexos.
- Stack aceita: Next.js 16.4.2, React 19, TypeScript, Tailwind 4 e Supabase. Node 24 do ambiente.
- Sem dependência de LLM para validar ingestão e isolamento: busca documental honesta funciona sem chave. Isso não substitui os testes reais do pipeline de IA.
- Endpoint/modelo e preço configuráveis; IA explicitamente desativada até autorização. Sem modelos ou preços não verificados fixados no código.
- Sem dados seed de negócio: planos são configuração comercial, fixtures ficam somente nos testes.
- Runtime local com componentes menores e reais: PostgreSQL/pgvector + GoTrue + PostgREST + Mailpit e gateway de desenvolvimento. Imagens fixadas por digest. O CLI completo não integra o workflow padrão: imagens completas excederam o disco de 32 GB. Não alterar HOME nem desativar verificações para instalar ferramentas.
- Imagens obtidas do registro Docker Hub com verificação normal de camadas; ECR estava bloqueado. Não é necessário ampliar a rede para o ECR.
- Parser DOCX usa fflate e leitura do XML. Mammoth foi removido após auditoria indicar dependência transitiva sem correção publicada.
- PDFs digitalizados são rejeitados com explicação; OCR não é simulado.
- Evolução: novos arquivos/textos agora preservam originais e snapshots integrais em PostgreSQL privado com quota de armazenamento. Backend de objetos é evolução futura; não adicionar serviço pago para validar o núcleo.
- Histórico é privado por usuário mesmo dentro da organização; indicadores da tela Inteligência deixam esse escopo explícito.
- Exclusão de fonte remove trechos e respostas derivadas; trilha de auditoria conserva identificador/ação, sem o conteúdo excluído.

- Callbacks usam origem pública configurada ou whitelist explícita de hosts locais; o bind interno 0.0.0.0 nunca é destino de login.
- Testes de navegador usam um único servidor compilado, e não duas instâncias dev concorrentes. O host do widget é um servidor HTTP real, evitando classificação artificial de rede em respostas interceptadas.

- Healthcheck do PostgreSQL usa TCP explicitamente, esperando o servidor principal após terminar o bootstrap; o servidor temporário de initdb (socket Unix) não pode liberar Auth antecipadamente. Inicialização do zero foi validada em stack e volume isolados.
- Cache npm local do projeto em .cache/npm para operações de desenvolvimento; instalador pode reutilizar /tmp/sivirinia-npm nesta nuvem. Nenhuma alteração em HOME.

- Worker possui papel SQL dedicado, sem service_role. Parser recebe somente bytes/nome/modo, sem segredos, em processo separado. Limites de heap e prazo não equivalem a sandbox de SO ou limite total de RSS.

- Relatórios PDF são arquivos reais gerados localmente com pdf-lib, com escopo/limites e custos desconhecidos explícitos. Filtros temporais usam dias de São Paulo a partir de 2020 (sem horário de verão nesse intervalo).
- Avaliação padrão sempre desliga IA no próprio processo; modo externo exige flags de autorização e configuração segura, não foi executado. O corpus é sintético e não comprova precisão em bases reais.
