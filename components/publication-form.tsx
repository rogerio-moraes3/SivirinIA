"use client";
import { useActionState } from "react";
import type { PublicationState, ChatState } from "@/lib/actions";
import { Citations } from "./forms";
export function PublicationForm({
  action,
  agent,
  sources,
  enabled,
}: {
  action: (
    state: PublicationState,
    form: FormData,
  ) => Promise<PublicationState>;
  agent: string;
  enabled: boolean;
  sources: { id: string; title: string }[];
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="form">
      <input name="agent" type="hidden" value={agent} />
      <p>
        Somente as fontes selecionadas serão expostas. Qualquer pessoa com o
        link poderá ler seus trechos, inclusive após futuras atualizações. Não
        selecione informações internas ou pessoais.
      </p>
      {sources.map((s) => (
        <label className="check-label" key={s.id}>
          <input type="checkbox" name="sources" value={s.id} />
          {s.title}
        </label>
      ))}
      <label>
        Digite PUBLICAR para confirmar
        <input
          name="acknowledgement"
          required
          pattern="PUBLICAR"
          autoComplete="off"
        />
      </label>
      <label className="check-label">
        <input name="consent" type="checkbox" required />
        Tenho autorização para tornar esse conteúdo público.
      </label>
      <button className="button" disabled={pending}>
        {pending ? "Ativando…" : "Ativar link e widget"}
      </button>
      {state.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}
      {state.success && enabled && (
        <p role="status" className="success">
          {state.success}
        </p>
      )}
      {state.token && enabled && (
        <div className="publication-result">
          <label>
            Link compartilhável
            <input
              readOnly
              value={`${window.location.origin}/s/${state.token}`}
              aria-label="Link compartilhável"
            />
          </label>
          <label>
            Código do widget
            <textarea
              readOnly
              rows={5}
              value={`<script src="${window.location.origin}/widget.js" data-agent="${state.token}" defer></script>`}
            />
          </label>
          <small>
            Use o domínio definitivo da sua instalação ao publicar o site. Cada
            nova publicação invalida o link anterior. A ativação aqui não faz
            deploy externo.
          </small>
        </div>
      )}
    </form>
  );
}
export function PublicChatForm({
  action,
}: {
  action: (state: ChatState, form: FormData) => Promise<ChatState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <>
      <form action={submit} className="form">
        <label>
          Sua pergunta
          <textarea
            name="question"
            required
            minLength={2}
            maxLength={2000}
            rows={3}
            placeholder="Como podemos ajudar?"
          />
        </label>
        <button className="button" disabled={pending}>
          {pending ? "Consultando fontes…" : "Enviar pergunta"}
        </button>
        {state.error && (
          <p role="alert" className="error">
            {state.error}
          </p>
        )}
      </form>
      {state.answer && (
        <article className="answer" aria-live="polite">
          <span className="badge">
            {state.mode === "generative"
              ? "Resposta gerada por IA"
              : state.mode === "extractive"
                ? "Busca documental · sem geração por IA"
                : "Evidência insuficiente"}
          </span>
          <p className="prewrap">{state.answer}</p>
          <Citations items={state.citations || []} />
        </article>
      )}
    </>
  );
}
