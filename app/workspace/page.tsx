import Link from "next/link";
import { requireUser } from "@/lib/access";
import { Brand } from "@/components/brand";
import { Form } from "@/components/forms";
import { createOrganization, logout, acceptInvitation } from "@/lib/actions";
export default async function Workspaces() {
  const { db, user } = await requireUser();
  const { data: orgs } = await db
    .from("organizations")
    .select("id,name,created_at")
    .order("created_at");
  return (
    <main id="conteudo" className="workspace-picker">
      <header>
        <Link href="/">
          <Brand />
        </Link>
        <form action={logout}>
          <button className="text-button">Sair</button>
        </form>
      </header>
      <span className="eyebrow">SEUS ESPAÇOS</span>
      <h1>Onde vamos trabalhar?</h1>
      <p className="muted">{user.email}</p>
      <div className="grid two">
        {orgs?.map((o) => (
          <Link
            className="card org-card"
            key={o.id}
            href={`/workspace/${o.id}`}
          >
            <h2>{o.name}</h2>
            <span>Abrir espaço de trabalho →</span>
          </Link>
        ))}
      </div>
      <section className="card">
        <h2>Criar uma organização</h2>
        <p>Os documentos e conversas ficam isolados neste espaço.</p>
        <Form action={createOrganization} label="Criar espaço">
          <label>
            Nome da empresa
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="Nome da sua empresa"
            />
          </label>
        </Form>
      </section>
      <section className="card">
        <h2>Recebeu um convite?</h2>
        <Form action={acceptInvitation} label="Aceitar convite">
          <label>
            Código do convite
            <input
              name="token"
              required
              minLength={64}
              maxLength={64}
              autoComplete="off"
            />
          </label>
        </Form>
      </section>
    </main>
  );
}
