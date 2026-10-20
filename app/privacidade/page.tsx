import Link from "next/link";
export default function Privacy() {
  return (
    <main id="conteudo" className="legal">
      <Link href="/">← SivirinIA</Link>
      <h1>Aviso de privacidade — desenvolvimento</h1>
      <p>
        O SivirinIA está em desenvolvimento. Este aviso não substitui a política
        definitiva, que depende da identificação do controlador, canais de
        atendimento e fornecedores aprovados.
      </p>
      <h2>Dados utilizados</h2>
      <p>
        Dados de conta, documentos enviados, perguntas, respostas, feedback e
        registros de uso são armazenados para operar e avaliar a plataforma. Não
        envie dados pessoais sensíveis neste ambiente.
      </p>
      <h2>Fornecedores</h2>
      <p>
        Contas e dados são processados pela instância Supabase configurada. Com
        IA habilitada, perguntas e trechos recuperados são enviados ao provedor
        configurado. Residência de dados e transferências internacionais
        dependem da infraestrutura escolhida.
      </p>
      <h2>Limitações atuais</h2>
      <p>
        Retenção automatizada, atendimento a titulares, exclusão da conta e política de remoção em backups precisam ser concluídos e revisados antes do lançamento
        público. Fontes podem ser removidas pela interface por membros
        autorizados.
      </p>
    </main>
  );
}
