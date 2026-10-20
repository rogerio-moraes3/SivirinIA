export const dynamic = "force-dynamic";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Form } from "@/components/forms";
import { signup } from "@/lib/actions";
import { isConfigured } from "@/lib/supabase/server";
export default function Signup() {
  return (
    <main className="auth-shell" id="conteudo">
      <div className="auth-card">
        <Link href="/">
          <Brand />
        </Link>
        <span className="eyebrow">SEU NOVO ESPAÇO DE CONHECIMENTO</span>
        <h1>
          Comece pela
          <br />
          primeira pergunta.
        </h1>
        <p>Crie sua conta e organize o conhecimento da sua empresa.</p>
        {isConfigured() ? (
          <Form action={signup} label="Criar minha conta">
            <label>
              E-mail profissional
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                aria-describedby="signup-password-help"
              />
            </label>
            <small id="signup-password-help">Pelo menos 12 caracteres.</small>
            <label className="check-label">
              <input type="checkbox" required />
              Li os <Link href="/termos">termos</Link> e o{" "}
              <Link href="/privacidade">aviso de privacidade</Link> do ambiente
              de desenvolvimento.
            </label>
          </Form>
        ) : (
          <p className="notice">
            O cadastro estará disponível após conectar o Supabase. Consulte o
            README.
          </p>
        )}
        <p>
          Já tem conta? <Link href="/login">Entrar →</Link>
        </p>
      </div>
    </main>
  );
}
