import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/access";
import { submitFeedback } from "@/lib/actions";
import { Citations } from "@/components/forms";
import type { Citation } from "@/lib/knowledge";
import { PageTitle } from "@/components/ui";
export default async function Conversation({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org, id } = await params;
  const { db } = await requireOrg(org);
  const { data: conversation } = await db
    .from("conversations")
    .select("id,title")
    .eq("organization_id", org)
    .eq("id", id)
    .single();
  if (!conversation) notFound();
  const { data: messages } = await db
    .from("messages")
    .select("*")
    .eq("organization_id", org)
    .eq("conversation_id", id)
    .order("sequence");
  return (
    <>
      <PageTitle
        eyebrow="CONVERSA"
        title={conversation.title}
        description="Perguntas, respostas e referências desta conversa privada."
      />
      {messages?.map((m) => (
        <article className={`card message ${m.role}`} key={m.id}>
          <span className="eyebrow">
            {m.role === "user" ? "VOCÊ" : "SIVIRINIA"}
          </span>
          {m.mode && (
            <span className="badge">
              {m.mode === "extractive"
                ? "Busca documental"
                : m.mode === "generative"
                  ? "Gerada por IA"
                  : "Sem evidência"}
            </span>
          )}
          <p className="prewrap">
            {m.status === "pending" ? "Consulta em processamento." : m.content}
          </p>
          {m.role === "assistant" && (
            <>
              <Citations items={m.citations as Citation[]} org={org} />
              {m.status === "complete" && (
                <form
                  action={submitFeedback.bind(null, org)}
                  className="actions"
                >
                  <input type="hidden" name="message" value={m.id} />
                  <span>Esta resposta ajudou?</span>
                  <button
                    className="button secondary"
                    name="helpful"
                    value="true"
                  >
                    Sim
                  </button>
                  <button
                    className="button secondary"
                    name="helpful"
                    value="false"
                  >
                    Não
                  </button>
                </form>
              )}
              <small className="muted">
                {m.input_tokens + m.output_tokens} tokens ·{" "}
                {m.cost_usd === null ? "Custo não medido" : `US$ ${m.cost_usd}`}{" "}
                · {m.latency_ms ?? "—"} ms
              </small>
            </>
          )}
        </article>
      ))}
    </>
  );
}
