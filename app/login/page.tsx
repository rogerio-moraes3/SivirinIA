export const dynamic = "force-dynamic";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Form } from "@/components/forms";
import { login } from "@/lib/actions";
import { isConfigured } from "@/lib/supabase/server";
export default function Login() {
  return (
    <main className="auth-shell" id="conteudo">
      <div className="auth-card">
        <Link href="/">
          <Brand />
        </Link>
        <span className="eyebrow">BEM-VINDO DE VOLTA</span>
        <h1>
          Seu conhecimento
          <br />
          espera por você.
        </h1>
        <p>Entre no seu espaço de trabalho.</p>
        {isConfigured() ? (
          <Form action={login} label="Entrar">
            <label>
              E-mail
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
              />
            </label>
          </Form>
        ) : (
          <div role="status" className="notice">
            <strong>Ambiente ainda não conectado</strong>
            <p>
              Configure a URL e a chave pública do Supabase em .env.local. O
              passo a passo está no README do projeto.
            </p>
          </div>
        )}
        <div className="auth-links">
          <Link href="/recover">Esqueci minha senha</Link>
          <Link href="/signup">Criar conta →</Link>
        </div>
      </div>
    </main>
  );
}
