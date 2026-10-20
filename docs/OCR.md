# OCR local em português

Executar `npm run ocr:install` antes do worker. Requer Tesseract, Poppler (`pdfinfo`, `pdftoppm`) e `prlimit` de util-linux. No Debian/Ubuntu: instalar os pacotes tesseract-ocr, poppler-utils e util-linux. O instalador principal também prepara o idioma; não contrata serviços.

Modelo oficial: [tessdata_fast 4.1.0 / por](https://github.com/tesseract-ocr/tessdata_fast/tree/4.1.0), SHA-256 `c4932b937207a9514b7514d518b931a99938c02a28a5a5a553f8599ed58b7deb`. Download com TLS e verificação de hash, cache em `.cache/ocr/por.traineddata`. Tesseract e dados de idioma usam licença Apache 2.0; Poppler é ferramenta de sistema separada.

Marcar **Usar OCR em português** no upload/atualização. O opt-in é persistido na tarefa; somente o worker processa o arquivo. PDF: reconhecimento de todas as páginas, mesclado com texto nativo sem repetir linhas idênticas. DOCX: somente imagens raster referenciadas pelo documento; links externos nunca são carregados e não se inventa paginação física. PNG/JPEG: página 1. Conteúdo, método e confiança média das palavras ficam no snapshot da versão; a confiança é uma estimativa do Tesseract, não garantia de correção. Conferir o original antes de usar informação crítica.

Limites: 10 MB por entrada, 5 páginas PDF ou imagens raster DOCX, dimensão máxima 4.096 por lado/12 milhões de pixels para imagens enviadas. Rasterização de PDF limitada a 1.800 pixels. Cada ferramenta nativa tem limite de espaço de endereçamento de 768 MiB, CPU de 10 s e timeout de 10 s; uma thread no Tesseract. O parser mantém o prazo total de 60 s/heap V8 de 512 MiB e lease de 120 s. O orçamento pode rejeitar documentos complexos em vez de persistir extração parcial.

O processo pai controla diretório temporário privado e encerra todo o grupo de processos no timeout. Originais não são enviados a fornecedores externos; arquivos temporários são removidos após sucesso/falha. Isso não equivale a sandbox completa do SO, antivírus ou homologação de todo PDF adversarial.

Testes reais: PDF de imagens em português, PDF misto, PNG e imagem referenciada em DOCX; preservação de páginas, recusa acima do limite, imagem hostil, opt-in, limpeza de temporários, fila e download byte a byte do original. As fixtures são documentos de teste gerados, não documentos de clientes. OCR não preserva layout visual/tabelas como estruturas semânticas; preserva texto e páginas de PDF.
