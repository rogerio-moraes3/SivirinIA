import Link from "next/link";
import { Bot } from "lucide-react";
import { requireOrg } from "@/lib/access";
import {
  saveAgent,
  deleteAgent,
  configureAgentSources,
  publishAgent,
  revokePublication,
} from "@/lib/actions";
import { PublicationForm } from "@/components/publication-form";
import { Form } from "@/components/forms";
import { PageTitle, Empty } from "@/components/ui";
export default async function Agents({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { db, member } = await requireOrg(org);
  const { data: agents } = await db
    .from("agents")
    .select("*")
    .eq("organization_id", org)
    .order("created_at");
  const { data: sources } = await db
    .from("knowledge_sources")
    .select("id,title")
    .eq("organization_id", org)
    .order("title");
  const { data: bindings } = await db
    .from("agent_sources")
    .select("agent_id,source_id")
    .eq("organization_id", org);
  const { data: publications } = ["owner", "admin"].includes(member.role)
    ? await db
        .from("agent_publications")
        .select("agent_id,enabled")
        .eq("organization_id", org)
    : { data: null };
  const write = ["owner", "admin", "editor"].includes(member.role);
  return (
    <>
      <PageTitle
        eyebrow="AGENTES"
        title="Especialistas no que você sabe."
        description="Agentes com fontes permitidas e compartilhamento sob seu controle."
      />
      {agents?.length ? (
        <div className="grid three">
          {agents.map((a) => (
            <article className="card agent-card" key={a.id}>
              <span className="agent-icon">
                <Bot />
              </span>
              <span className="badge">
                {publications?.some((p) => p.agent_id === a.id && p.enabled)
                  ? "Link ativo"
                  : "Acesso interno"}
              </span>
              <h2>{a.name}</h2>
              <p>{a.description || "Agente de conhecimento da organização."}</p>
              <Link
                className="button secondary"
                href={`/workspace/${org}/chat?agent=${a.id}`}
              >
                Abrir conversa →
              </Link>
              {write && (
                <details className="citation">
                  <summary>Fontes permitidas</summary>
                  <Form
                    action={configureAgentSources.bind(null, org)}
                    label="Salvar fontes"
                  >
                    <input name="agent" type="hidden" value={a.id} />
                    <label className="check-label">
                      <input
                        name="all_sources"
                        type="checkbox"
                        defaultChecked={a.use_all_sources}
                      />
                      Consultar todas as fontes que o usuário pode acessar
                    </label>
                    <p>
                      Desmarque a opção acima para restringir às fontes
                      selecionadas. Uma seleção vazia não permite nenhuma fonte.
                    </p>
                    {sources?.map((s) => (
                      <label key={s.id} className="check-label">
                        <input
                          type="checkbox"
                          name="sources"
                          value={s.id}
                          defaultChecked={bindings?.some(
                            (b) => b.agent_id === a.id && b.source_id === s.id,
                          )}
                        />
                        {s.title}
                      </label>
                    ))}
                  </Form>
                </details>
              )}
              {["owner", "admin"].includes(member.role) && (
                <details className="citation">
                  <summary>Link público e widget</summary>
                  <PublicationForm
                    enabled={
                      publications?.some(
                        (p) => p.agent_id === a.id && p.enabled,
                      ) || false
                    }
                    agent={a.id}
                    sources={sources || []}
                    action={publishAgent.bind(null, org)}
                  />
                  <hr />
                  <Form
                    action={revokePublication.bind(null, org)}
                    label="Revogar publicação"
                  >
                    <input name="agent" type="hidden" value={a.id} />
                  </Form>
                </details>
              )}
              {write && (
                <details className="citation">
                  <summary>Editar agente</summary>
                  <Form
                    action={saveAgent.bind(null, org)}
                    label="Salvar alterações"
                  >
                    <input name="agent" type="hidden" value={a.id} />
                    <label>
                      Nome do agente
                      <input
                        name="name"
                        defaultValue={a.name}
                        minLength={2}
                        maxLength={100}
                        required
                      />
                    </label>
                    <label>
                      Descrição do agente
                      <textarea
                        name="description"
                        defaultValue={a.description}
                        maxLength={1000}
                      />
                    </label>
                    <label>
                      Preferências do agente
                      <textarea
                        name="instructions"
                        defaultValue={a.instructions}
                        maxLength={4000}
                      />
                    </label>
                  </Form>
                  <hr />
                  <Form
                    action={deleteAgent.bind(null, org)}
                    label="Excluir agente"
                  >
                    <input name="agent" type="hidden" value={a.id} />
                    <label className="check-label">
                      <input type="checkbox" name="confirm" required />
                      Confirmo excluir o agente e suas conversas.
                    </label>
                  </Form>
                </details>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Seu primeiro especialista"
          description="Crie um agente para consultar o conhecimento da sua empresa."
        />
      )}
      {write && (
        <section className="card form-section">
          <h2>Criar agente</h2>
          <Form action={saveAgent.bind(null, org)} label="Criar agente">
            <label>
              Nome
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ex.: Especialista de suporte"
              />
            </label>
            <label>
              Objetivo
              <textarea
                name="description"
                maxLength={1000}
                placeholder="Como este agente vai ajudar a equipe?"
              />
            </label>
            <label>
              Preferências de comunicação
              <textarea
                name="instructions"
                maxLength={4000}
                placeholder="Ex.: Responda de forma objetiva e em português."
              />
              <small>
                Preferências não substituem as regras de evidência e segurança.
              </small>
            </label>
          </Form>
        </section>
      )}
    </>
  );
}
