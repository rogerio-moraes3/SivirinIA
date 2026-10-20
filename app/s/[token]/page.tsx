import { notFound } from "next/navigation";
import { supabase, isConfigured } from "@/lib/supabase/server";
import { askPublicQuestion } from "@/lib/actions";
import { PublicChatForm } from "@/components/publication-form";
import { Brand } from "@/components/brand";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Assistente compartilhado",
  robots: { index: false, follow: false },
};
export default async function SharedChat({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { token } = await params;
  const { embed } = await searchParams;
  if (!/^[a-f0-9]{64}$/.test(token) || !isConfigured()) notFound();
  const db = await supabase();
  const { data: agent, error } = await db.rpc("public_agent_info", {
    access_token: token,
  });
  if (error || !agent) notFound();
  return (
    <main
      id="conteudo"
      className={embed === "1" ? "shared-chat embedded" : "shared-chat"}
    >
      <header>
        <Brand />
        <span className="badge">Assistente público</span>
      </header>
      <h1>{agent.name}</h1>
      <p>
        {agent.description ||
          "Faça uma pergunta às fontes publicadas deste assistente."}
      </p>
      <PublicChatForm action={askPublicQuestion.bind(null, token)} />
      <small className="muted">
        Confira as referências. Perguntas são registradas pela organização
        responsável por este assistente. Não envie dados sensíveis. Este chat
        consulta somente as fontes publicadas.
      </small>
    </main>
  );
}
