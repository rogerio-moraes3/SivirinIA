import Link from "next/link";
export default function NotFound() {
  return (
    <main className="legal" id="conteudo">
      <h1>Página indisponível</h1>
      <p>O recurso não existe ou você não tem permissão para acessá-lo.</p>
      <Link className="button" href="/workspace">
        Voltar ao meu espaço
      </Link>
    </main>
  );
}
