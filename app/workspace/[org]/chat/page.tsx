import { requireOrg } from "@/lib/access";
import { askQuestion } from "@/lib/actions";
import { ChatForm } from "@/components/forms";
import { PageTitle } from "@/components/ui";
export default async function Chat({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ agent?: string }>;
}) {
  const { org } = await params;
  const { agent } = await searchParams;
  const { db } = await requireOrg(org);
  const { data: agents } = await db
    .from("agents")
    .select("id,name")
    .eq("organization_id", org)
    .order("created_at");
  const sorted = [...(agents || [])].sort((a, b) =>
    a.id === agent ? -1 : b.id === agent ? 1 : 0,
  );
  return (
    <>
      <PageTitle
        eyebrow="CONVERSAR COM A BASE"
        title="Pergunte. Confira. Avance."
        description="Busque no conhecimento da sua empresa e leia as fontes de cada resposta."
      />
      <div className="notice">
        <strong>
          {process.env.AI_ENABLED === "true" &&
          process.env.AI_API_KEY &&
          process.env.AI_CHAT_MODEL
            ? "Geração por IA configurada"
            : "Busca documental ativa"}
        </strong>
        <p>
          {process.env.AI_ENABLED === "true" &&
          process.env.AI_API_KEY &&
          process.env.AI_CHAT_MODEL
            ? "Respostas sintetizadas a partir de evidências. Confira as referências antes de tomar decisões."
            : "Sem provedor de IA configurado, retornamos os trechos reais encontrados. Não simulamos respostas geradas por IA."}
        </p>
      </div>
      <section className="card">
        <ChatForm
          key={agent || "default"}
          action={askQuestion.bind(null, org)}
          agents={sorted}
          org={org}
        />
      </section>
      <p className="muted">
        Cada tentativa aceita consome uma consulta, inclusive quando não há
        evidência ou o provedor falha. Perguntas anteriores ficam no histórico;
        a recuperação atual usa a pergunta enviada, sem reformulação contextual.
      </p>
    </>
  );
}
