import { roleLabels } from "@/lib/roles";
import { requireOrg } from "@/lib/access";
import { PageTitle } from "@/components/ui";
import { Form } from "@/components/forms";
import { renameOrganization, deleteOrganization } from "@/lib/actions";
export default async function Settings({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { organization, member } = await requireOrg(org);
  return (
    <>
      <PageTitle
        eyebrow="CONFIGURAÇÕES"
        title="Seu espaço, seus controles."
        description="Informações de configuração da organização."
      />
      <section className="card">
        <h2>{organization.name}</h2>
        {["owner", "admin"].includes(member.role) && (
          <Form
            action={renameOrganization.bind(null, org)}
            label="Atualizar nome"
          >
            <label>
              Nome da organização
              <input
                name="name"
                defaultValue={organization.name}
                required
                minLength={2}
                maxLength={100}
              />
            </label>
          </Form>
        )}
        <dl>
          <dt>Identificador</dt>
          <dd>
            <code>{org}</code>
          </dd>
          <dt>Seu perfil</dt>
          <dd>{roleLabels[member.role]}</dd>
          <dt>Plano</dt>
          <dd>{organization.plans.name}</dd>
          <dt>Publicação externa</dt>
          <dd>
            Somente por ativação explícita em Meus agentes, com seleção de
            fontes públicas.
          </dd>
        </dl>
      </section>
      {member.role === "owner" && (
        <section className="card form-section">
          <h2>Excluir organização</h2>
          <p>
            Remove permanentemente agentes, documentos indexados, conversas,
            convites, uso e trilha de auditoria deste espaço. Sua conta e outros
            espaços são preservados. Não executa remoção de backups externos.
          </p>
          <Form
            action={deleteOrganization.bind(null, org)}
            label="Excluir organização permanentemente"
          >
            <label>
              Digite o nome exato da organização
              <input
                name="confirmation"
                required
                maxLength={100}
                autoComplete="off"
              />
            </label>
            <label className="check-label">
              <input name="confirm" type="checkbox" required />
              Entendo que esta ação não pode ser desfeita.
            </label>
          </Form>
        </section>
      )}
      <div className="notice">
        Esta versão é destinada a desenvolvimento e validação. Ainda não envie
        dados sensíveis: políticas de retenção, exclusão de organização e
        revisão de segurança estão pendentes.
      </div>
    </>
  );
}
