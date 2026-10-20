import { Form } from "@/components/forms";
import { recover } from "@/lib/actions";
import Link from "next/link";
export default function Recover() {
  return (
    <main id="conteudo" className="auth-shell">
      <section className="auth-card">
        <h1>Recuperar acesso</h1>
        <p>Enviaremos um link de recuperação, se houver uma conta.</p>
        <Form action={recover} label="Enviar instruções">
          <label>
            E-mail
            <input type="email" name="email" required autoComplete="email" />
          </label>
        </Form>
        <Link href="/login">Voltar ao login</Link>
      </section>
    </main>
  );
}
