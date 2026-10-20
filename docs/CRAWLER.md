# Crawler de sites e sitemaps

`npm run crawl -- https://dominio-publico.example --pages=10 --depth=2 --sitemap=https://dominio-publico.example/sitemap.xml`

CLI funcional de coleta e comparação, sem conexão automática ao painel/fila de fontes. Não existe ainda agendamento recorrente, exclusão automática de fontes nem sincronização operacional. Resultados privados em `.local/crawls/`, sem conteúdo fictício. Uma varredura incompleta retorna código 1 e não substitui o último resultado completo.

Implementado: BFS, links deduplicados da mesma origem HTTPS, sitemap/urlset e sitemapindex, hashes por página e diferenças added/changed/unchanged/removed. Remoções só podem ser indicadas após coleta completa com o mesmo escopo; falha/limite nunca significa que a página foi excluída. O comando apenas relata diferenças, não exclui dados.

Limites: 1–50 páginas, profundidade 0–5, até 10 sitemaps e dois níveis de índices, 500 endereços por sitemap, 1 MiB por XML, 2 milhões de caracteres por site. Interrompe novas coletas ao ultrapassar 90 s; chamadas em andamento têm limites próprios. HTML respeita robots.txt conservador. XML com DTD/ENTITY é recusado; sitemaps, seus endereços e redirecionamentos precisam manter a origem. Não executa JavaScript.

Transporte: somente HTTPS/443, bloqueio de credenciais/rede privada, validação de todos os IPs DNS, fixação de IP e TLS para o hostname original. DNS tem espera máxima de 5 s; requisição HTTPS tem prazo absoluto de 15 s e limite de bytes, além do timeout de inatividade. Um lookup nativo pendente não é cancelável, mas a requisição do usuário deixa de aguardá-lo no prazo.

Validação nesta nuvem: DNS nativo retorna EAI_AGAIN; tentativa de DoH Cloudflare recebeu HTTP 403. O CLI executado contra example.com retornou zero páginas e varredura incompleta, sem simular sucesso. Nenhuma validação positiva de website público foi realizada. Transporte/parser e orquestração têm testes de contrato identificados com simuladores apenas em tests/. TLS, SSRF e pinning foram mantidos.
