import { roleLabels } from "@/lib/roles";
import { requireOrg } from "@/lib/access";
import { PageTitle, date } from "@/components/ui";
import { Form } from "@/components/forms";
import { inviteMember, changeRole } from "@/lib/actions";
export default async function Team({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { db, user, member } = await requireOrg(org);
  const { data: members } = await db
    .from("organization_members")
    .select("user_id,role,created_at")
    .eq("organization_id", org);
  const manage = ["owner", "admin"].includes(member.role);
  const { data: invitations } = manage
    ? await db
        .from("invitations")
        .select("id,email,role,expires_at,accepted_at")
        .eq("organization_id", org)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
    : { data: null };
  return (
    <>
      <PageTitle
        eyebrow="EQUIPE"
        title="Conhecimento compartilhado com controle."
        description="Membros, convites e funções do espaço de trabalho."
      />
      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Membro</th>
              <th>Perfil</th>
              <th>Desde</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members?.map((m) => (
              <tr key={m.user_id}>
                <td>{m.user_id === user.id ? user.email : m.user_id}</td>
                <td>{roleLabels[m.role]}</td>
                <td>{date(m.created_at)}</td>
                <td>
                  {member.role === "owner" && m.role !== "owner" && (
                    <Form
                      action={changeRole.bind(null, org)}
                      label="Atualizar perfil"
                    >
                      <input type="hidden" name="member" value={m.user_id} />
                      <select
                        name="role"
                        defaultValue={m.role}
                        aria-label="Novo perfil"
                      >
                        {["admin", "editor", "analyst", "viewer"].map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                    </Form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {manage && (
        <section className="card form-section">
          <h2>Convidar membro</h2>
          <p>
            O código é exibido uma única vez. Compartilhe por um canal privado
            com a pessoa convidada. Ela precisará entrar com o mesmo e-mail e
            aceitar o código na página de espaços.
          </p>
          <Form action={inviteMember.bind(null, org)} label="Gerar convite">
            <label>
              E-mail
              <input name="email" type="email" required />
            </label>
            <label>
              Perfil
              <select name="role" defaultValue="viewer">
                {(member.role === "owner"
                  ? ["admin", "editor", "analyst", "viewer"]
                  : ["editor", "analyst", "viewer"]
                ).map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </label>
          </Form>
          {invitations?.length ? (
            <>
              <h3 className="mt">Convites pendentes</h3>
              {invitations.map((i) => (
                <p key={i.id}>
                  {i.email} · {roleLabels[i.role]} · expira {date(i.expires_at)}
                </p>
              ))}
            </>
          ) : null}
        </section>
      )}
    </>
  );
}
