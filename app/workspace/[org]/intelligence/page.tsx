import { requireOrg } from "@/lib/access";
import { PageTitle, Empty } from "@/components/ui";
import { analyzeKnowledge, type AnswerRecord } from "@/lib/analytics";
export default async function Intelligence({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { db } = await requireOrg(org);
  const [
    { data: messages },
    { data: questions },
    { data: feedback },
    { data: sources },
  ] = await Promise.all([
    db
      .from("messages")
      .select(
        "id,reply_to,mode,status,created_at,citations,input_tokens,output_tokens,cost_usd,model",
      )
      .eq("organization_id", org)
      .eq("role", "assistant")
      .order("sequence", { ascending: false })
      .limit(1000),
    db
      .from("messages")
      .select("id,content")
      .eq("organization_id", org)
      .eq("role", "user")
      .order("sequence", { ascending: false })
      .limit(1000),
    db.from("feedback").select("helpful").eq("organization_id", org),
    db
      .from("knowledge_source_health")
      .select("id,title,updated_at,needs_review")
      .eq("organization_id", org),
  ]);
  const rows = (messages || []) as AnswerRecord[];
  const report = analyzeKnowledge(rows, questions || []);
  const complete = rows.filter((m) => m.status === "complete"),
    absent = complete.filter((m) => m.mode === "abstention"),
    cited = complete.filter(
      (m) => m.mode === "extractive" || m.mode === "generative",
    ),
    failed = rows.filter((m) => m.status === "failed");
  const unused = (sources || []).filter(
    (s) => !report.sources.some((r) => r.sourceId === s.id),
  );
  const old = (sources || []).filter((s) => s.needs_review);
  return (
    <>
      <PageTitle
        eyebrow="INTELIGÊNCIA"
        title="O que suas perguntas revelam."
        description="Seu histórico privado: até 1.000 respostas. Conversas de outros membros não são incluídas."
        action={
          <a
            className="button secondary"
            href={`/api/organizations/${org}/export`}
          >
            Exportar CSV
          </a>
        }
      />
      <div className="grid four stats">
        {[
          ["Consultas registradas", rows.length],
          ["Com evidência", cited.length],
          ["Sem resposta", absent.length],
          ["Falhas", failed.length],
        ].map(([t, n]) => (
          <article className="card" key={String(t)}>
            <span className="muted">{t}</span>
            <strong>{n}</strong>
          </article>
        ))}
      </div>
      {rows.length ? (
        <>
          <section className="card">
            <h2>Qualidade observada</h2>
            <p>
              Respostas com evidência:{" "}
              <strong>
                {complete.length
                  ? Math.round((cited.length / complete.length) * 100)
                  : 0}
                %
              </strong>{" "}
              das consultas concluídas. Esse indicador não comprova correção
              factual nem resolução do atendimento.
            </p>
            <p>
              Feedback no seu histórico:{" "}
              {feedback?.filter((f) => f.helpful).length || 0} positivos,{" "}
              {feedback?.filter((f) => !f.helpful).length || 0} negativos.
            </p>
          </section>
          <div className="grid two analytics-grid">
            <section className="card">
              <h2>Perguntas frequentes</h2>
              <p>
                Agrupamento por texto normalizado; não é agrupamento semântico.
              </p>
              {report.frequent.map((f) => (
                <div className="report-row" key={f.question}>
                  <span>{f.question}</span>
                  <strong>{f.count}</strong>
                </div>
              ))}
            </section>
            <section className="card">
              <h2>Fontes consultadas</h2>
              {report.sources.length ? (
                report.sources.map((s) => (
                  <div className="report-row" key={s.sourceId}>
                    <span>{s.title}</span>
                    <strong>{s.count}</strong>
                  </div>
                ))
              ) : (
                <p>Nenhuma fonte citada neste recorte.</p>
              )}
            </section>
            <section className="card full">
              <h2>Perguntas sem resposta</h2>
              <p>
                Use as dúvidas abaixo para orientar a documentação. Falhas
                técnicas são identificadas separadamente.
              </p>
              {report.unresolved.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Pergunta</th>
                        <th>Motivo</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.unresolved.map((q, i) => (
                        <tr key={i}>
                          <td>{q.question}</td>
                          <td>{q.reason}</td>
                          <td>{q.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Nenhuma consulta sem resposta neste recorte.</p>
              )}
            </section>
            <section className="card">
              <h2>Consultas por dia</h2>
              {report.daily.map((d) => (
                <div className="report-row" key={d.day}>
                  <span>{d.day}</span>
                  <span
                    className="chart-bar"
                    style={{
                      width: `${Math.max(3, (d.count / Math.max(...report.daily.map((x) => x.count))) * 60)}%`,
                    }}
                  />
                  <strong>{d.count}</strong>
                </div>
              ))}
            </section>
            <section className="card">
              <h2>Uso por modelo</h2>
              {report.models.map((m) => (
                <div key={m.model}>
                  <h3>{m.model}</h3>
                  <p>
                    {m.tokens.toLocaleString("pt-BR")} tokens · US${" "}
                    {m.measuredCost.toFixed(6)} de custo de geração medido ·{" "}
                    {m.unmeasured} consultas sem medição financeira.
                  </p>
                </div>
              ))}
              <small className="muted">
                Embeddings e infraestrutura ainda não estão incluídos.
              </small>
            </section>
            <section className="card">
              <h2>Fontes sem uso observado</h2>
              <p>
                Sem citações nas suas últimas 1.000 respostas; não significa que
                a fonte seja desnecessária.
              </p>
              {unused.length ? (
                unused.map((s) => <p key={s.id}>{s.title}</p>)
              ) : (
                <p>Todas as fontes visíveis foram citadas neste recorte.</p>
              )}
            </section>
            <section className="card">
              <h2>Revisão de conteúdo</h2>
              <p>
                Critério de atenção: sem atualização há mais de 90 dias. É uma
                heurística, não uma afirmação de que o documento esteja
                desatualizado.
              </p>
              {old.length ? (
                old.map((s) => <p key={s.id}>{s.title}</p>)
              ) : (
                <p>Nenhuma fonte atende ao critério.</p>
              )}
            </section>
          </div>
        </>
      ) : (
        <Empty
          title="Os dados começam com as perguntas"
          description="Quando sua equipe usar a base, os indicadores reais aparecerão aqui."
        />
      )}
    </>
  );
}
