import Link from "next/link";
import { requireOrg } from "@/lib/access";
import { PageTitle } from "@/components/ui";
export default async function Dashboard({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { db, organization } = await requireOrg(org);
  const [
    { count: agents },
    { count: sources },
    { data: usage },
    { data: recent },
  ] = await Promise.all([
    db
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org),
    db
      .from("knowledge_sources")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org),
    db
      .from("monthly_usage")
      .select("*")
      .eq("organization_id", org)
      .eq("month", new Date().toISOString().slice(0, 7) + "-01")
      .maybeSingle(),
    db
      .from("knowledge_sources")
      .select("id,title,kind,updated_at")
      .eq("organization_id", org)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);
  return (
    <>
      <PageTitle
        eyebrow="VISÃO GERAL"
        title={`Olá, ${organization.name}.`}
        description="Um lugar para conectar o que sua empresa sabe."
        action={
          <Link className="button" href={`/workspace/${org}/sources`}>
            + Adicionar conhecimento
          </Link>
        }
      />
      <div className="grid three stats">
        {[
          [
            "Agentes ativos",
            agents || 0,
            `de ${organization.plans.agent_limit} no seu plano`,
          ],
          [
            "Fontes indexadas",
            sources || 0,
            "Documentos disponíveis para busca",
          ],
          [
            "Consultas neste mês",
            usage?.responses || 0,
            `de ${organization.plans.response_limit} disponíveis`,
          ],
        ].map(([t, v, d]) => (
          <article className="card" key={String(t)}>
            <span className="muted">{t}</span>
            <strong>{v}</strong>
            <small>{d}</small>
          </article>
        ))}
      </div>
      <section className="welcome-card">
        <div>
          <span className="eyebrow">DO CONTEÚDO À CONVERSA</span>
          <h2>
            Seu primeiro agente
            <br />
            começa com uma boa fonte.
          </h2>
          <p>
            Adicione um documento, crie um agente e faça a primeira pergunta.
            Cada resultado mostra de onde veio.
          </p>
          <Link className="button" href={`/workspace/${org}/chat`}>
            Conversar com a base →
          </Link>
        </div>
        <div className="onboarding-steps">
          {[
            [
              "01",
              "Adicione uma fonte",
              "PDF, DOCX, texto ou uma URL",
              "sources",
            ],
            [
              "02",
              "Dê vida ao seu agente",
              "Defina nome, objetivo e preferências",
              "agents",
            ],
            [
              "03",
              "Encontre sua primeira resposta",
              "Confira os trechos e referências",
              "chat",
            ],
          ].map(([n, t, d, path]) => (
            <Link key={n} href={`/workspace/${org}/${path}`}>
              <span>{n}</span>
              <div>
                <strong>{t}</strong>
                <small>{d}</small>
              </div>
              <span>↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="section-heading">
          <h2>Conhecimento recente</h2>
          <Link href={`/workspace/${org}/sources`}>Ver base →</Link>
        </div>
        {recent?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fonte</th>
                  <th>Formato</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/workspace/${org}/sources?source=${s.id}`}>
                        {s.title}
                      </Link>
                    </td>
                    <td>{s.kind.toUpperCase()}</td>
                    <td>
                      <span className="badge">Indexada</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            Sua base está pronta para receber o primeiro documento.
          </p>
        )}
      </section>
    </>
  );
}
