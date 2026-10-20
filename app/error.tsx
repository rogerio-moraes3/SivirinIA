"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="legal">
      <h1>Não foi possível carregar esta página.</h1>
      <p>
        Tente novamente. Se o erro persistir, verifique a configuração do
        ambiente.
      </p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
