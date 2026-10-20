import { Form } from "@/components/forms";
import { resetPassword } from "@/lib/actions";
import { requireUser } from "@/lib/access";
export default async function Reset() {
  await requireUser();
  return (
    <main id="conteudo" className="auth-shell">
      <section className="auth-card">
        <h1>Defina sua nova senha</h1>
        <Form action={resetPassword} label="Salvar nova senha">
          <label>
            Nova senha
            <input
              type="password"
              name="password"
              required
              minLength={12}
              autoComplete="new-password"
            />
          </label>
        </Form>
      </section>
    </main>
  );
}
