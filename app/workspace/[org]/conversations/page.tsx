import Link from "next/link";
import { requireOrg } from "@/lib/access";
import { PageTitle, Empty, date } from "@/components/ui";
export default async function Conversations({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { db } = await requireOrg(org);
  const { data: conversations } = await db
    .from("conversations")
    .select("id,title,created_at,agents(name)")
    .eq("organization_id", org)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <>
      <PageTitle
        eyebrow="CONVERSAS"
        title="O caminho de cada resposta."
        description="Seu histórico privado de perguntas, respostas e evidências. Últimas 100 conversas."
      />
      {conversations?.length ? (
        <section className="card">
          <table>
            <thead>
              <tr>
                <th>Pergunta inicial</th>
                <th>Data</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{date(c.created_at)}</td>
                  <td>
                    <Link href={`/workspace/${org}/conversations/${c.id}`}>
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <Empty
          title="Sua primeira conversa está por vir"
          description="Adicione fontes e faça uma pergunta ao seu agente."
        >
          <Link className="button" href={`/workspace/${org}/chat`}>
            Começar conversa
          </Link>
        </Empty>
      )}
    </>
  );
}
