import Link from "next/link";
export default function Terms() {
  return (
    <main id="conteudo" className="legal">
      <Link href="/">← SivirinIA</Link>
      <h1>Condições do ambiente de desenvolvimento</h1>
      <p>
        Versão para testes controlados. Não é uma oferta de serviço comercial.
        Os termos definitivos dependem de revisão jurídica e identificação do
        operador.
      </p>
      <p>
        Envie apenas documentos que você esteja autorizado a utilizar. Confira
        as fontes antes de tomar decisões: respostas de IA podem conter erros.
      </p>
      <p>
        Não há cobrança ativa nem garantia de disponibilidade, recuperação ou
        adequação para documentos sensíveis. Não use como orientação médica,
        jurídica ou financeira.
      </p>
    </main>
  );
}
