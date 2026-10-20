import { requireOrg } from "@/lib/access";
import { PageTitle } from "@/components/ui";
export default async function Billing({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { db, organization, member } = await requireOrg(org);
  const [{ data: usage }, { data: sources }, { count: agents }] =
    await Promise.all([
      db
        .from("monthly_usage")
        .select("responses")
        .eq("organization_id", org)
        .eq("month", new Date().toISOString().slice(0, 7) + "-01")
        .maybeSingle(),
      db
        .from("knowledge_sources")
        .select("page_count")
        .eq("organization_id", org),
      db
        .from("agents")
        .select("*", { head: true, count: "exact" })
        .eq("organization_id", org),
    ]);
  const canReadBilling = ["owner", "admin"].includes(member.role);
  const { data: intents, error: billingError } = canReadBilling
    ? await db
        .from("billing_intents")
        .select("id,amount_cents,status,created_at")
        .eq("organization_id", org)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: null, error: null };
  if (billingError)
    throw new Error(
      "Não foi possível carregar o histórico financeiro de teste.",
    );
  const billingLabels: Record<string, string> = {
    created: "Intenção criada; cobrança não iniciada",
    pending: "Pendente",
    in_process: "Em processamento",
    approved: "Aprovado em sandbox",
    rejected: "Rejeitado",
    cancelled: "Cancelado",
    refunded: "Reembolsado em sandbox",
    charged_back: "Contestação em sandbox",
  };
  const plan = organization.plans;
  return (
    <>
      <PageTitle
        eyebrow="PLANO E CONSUMO"
        title="Cresça com previsibilidade."
        description="Limites aplicados no servidor e no banco, antes de aceitar novas consultas."
      />
      <section className="card">
        <span className="badge">{plan.name}</span>
        <h2>Seu plano atual</h2>
        <div className="grid three stats">
          {[
            ["Consultas do mês", usage?.responses || 0, plan.response_limit],
            [
              "Páginas indexadas",
              (sources || []).reduce((n, s) => n + s.page_count, 0),
              plan.page_limit,
            ],
            ["Agentes", agents || 0, plan.agent_limit],
          ].map(([t, used, total]) => (
            <div key={t}>
              <span>{t}</span>
              <strong>
                {used} <small>/ {total}</small>
              </strong>
              <progress
                value={Number(used)}
                max={Number(total)}
                aria-label={String(t)}
              />
            </div>
          ))}
        </div>
        <p className="muted">
          A franquia mensal usa o mês de calendário em UTC e inclui consultas
          públicas. A cota de páginas usa unidades de 3.000 caracteres indexados
          (incluindo sobreposição) e, para PDFs, no mínimo o número físico da
          última página com texto.
        </p>
      </section>
      {canReadBilling && (
        <section className="card">
          <h2>Homologação financeira (sandbox)</h2>
          <p>
            Registros de teste separados de cobranças reais. Aprovação sandbox
            não altera seu plano comercial. Checkout e assinaturas recorrentes
            ainda não estão conectados.
          </p>
          {intents?.length ? (
            <table>
              <thead>
                <tr>
                  <th>Referência</th>
                  <th>Valor de teste</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {intents.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id.slice(0, 8)}</td>
                    <td>
                      {(item.amount_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td>{billingLabels[item.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nenhuma intenção de pagamento de teste registrada.</p>
          )}
        </section>
      )}
      <div className="notice">
        <strong>Sem cobrança ativa</strong>
        <p>
          O gateway ainda não está conectado. Não há checkout nem upgrade pago
          disponível. Nenhuma transação financeira é executada por esta versão.
        </p>
      </div>
    </>
  );
}
