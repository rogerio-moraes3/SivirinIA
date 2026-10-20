import Link from "next/link";
export default function Security() {
  return (
    <main id="conteudo" className="legal">
      <Link href="/">← SivirinIA</Link>
      <h1>Segurança com limites claros</h1>
      <h2>Controles implementados</h2>
      <ul>
        <li>Autenticação Supabase e verificação da sessão no servidor.</li>
        <li>Políticas RLS e autorização por organização no banco de dados.</li>
        <li>Funções transacionais para aplicação de cotas.</li>
        <li>
          Importação de URLs HTTPS com validação DNS e bloqueio de redes
          privadas.
        </li>
        <li>Validação de formatos e tamanho de uploads.</li>
      </ul>
      <h2>Antes de produção</h2>
      <p>
        São necessárias revisão independente de segurança, testes de carga,
        configuração de e-mail, backups, monitoramento, políticas de retenção e
        documentação jurídica. Não declaramos certificação ou conformidade
        integral com a LGPD.
      </p>
    </main>
  );
}
