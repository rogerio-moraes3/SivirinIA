"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionState, ChatState } from "@/lib/actions";
import type { Citation } from "@/lib/knowledge";
export function Form({
  action,
  children,
  label = "Salvar",
  className = "",
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className={`form ${className}`}>
      {children}
      {state.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="success">
          {state.success}
        </p>
      )}
      <button disabled={pending} className="button" type="submit">
        {pending ? "Processando…" : label}
      </button>
    </form>
  );
}
export function Citations({ items, org }: { items: Citation[]; org?: string }) {
  return (
    <div className="citations">
      {items.map((c) => (
        <details key={c.number} className="citation">
          <summary>
            [{c.number}] {c.title}
            {c.page ? ` · página ${c.page}` : ""} · v{c.version}
          </summary>
          <blockquote>{c.quote}</blockquote>
          {org && (
            <a href={`/workspace/${org}/sources?source=${c.source_id}`}>
              Ver fonte na base
            </a>
          )}
          {c.url && /^https:\/\//.test(c.url) && (
            <a href={c.url} target="_blank" rel="noreferrer">
              Abrir original ↗
            </a>
          )}
        </details>
      ))}
    </div>
  );
}
export function ChatForm({
  action,
  agents,
  org,
}: {
  action: (state: ChatState, form: FormData) => Promise<ChatState>;
  agents: { id: string; name: string }[];
  org: string;
}) {
  const router = useRouter();
  const [state, submit, pending] = useActionState(action, {});
  const [selected, setSelected] = useState(agents[0]?.id || "");
  if (!agents.length)
    return (
      <div className="empty">
        <h2>Crie seu primeiro agente</h2>
        <p>
          Depois de adicionar suas fontes, seu agente poderá buscar respostas
          nelas.
        </p>
        <a className="button" href={`/workspace/${org}/agents`}>
          Criar agente
        </a>
      </div>
    );
  return (
    <>
      <form action={submit} className="form chat-form">
        <label>
          Agente
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              router.push(`?agent=${e.target.value}`);
            }}
            disabled={pending || !!state.conversationId}
          >
            {agents.map((a) => (
              <option value={a.id} key={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="agent" value={selected} />
        <label>
          Sua pergunta
          <textarea
            name="question"
            required
            minLength={2}
            maxLength={2000}
            rows={3}
            placeholder="O que você quer encontrar nos seus documentos?"
          />
        </label>
        <button className="button" disabled={pending}>
          {pending ? "Consultando suas fontes…" : "Perguntar à base →"}
        </button>
        {state.error && (
          <p role="alert" className="error">
            {state.error}
          </p>
        )}
      </form>
      {state.answer && (
        <article aria-live="polite" className="answer">
          <span className="badge">
            {state.mode === "generative"
              ? "Resposta gerada por IA"
              : state.mode === "extractive"
                ? "Busca documental · sem geração por IA"
                : "Evidência insuficiente"}
          </span>
          <p className="prewrap">{state.answer}</p>
          <Citations items={state.citations || []} org={org} />
          <a href={`/workspace/${org}/conversations/${state.conversationId}`}>
            Ver conversa e avaliar resposta →
          </a>
        </article>
      )}
    </>
  );
}
