import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ShieldCheck,
  ScanSearch,
  Layers3,
  Sparkles,
  Network,
  Check,
} from "lucide-react";
import { Brand } from "@/components/brand";
export default function Home() {
  return (
    <>
      <header className="marketing-header">
        <Link href="/" aria-label="SivirinIA — início">
          <Brand />
        </Link>
        <nav aria-label="Principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#recursos">Recursos</a>
          <a href="#precos">Preços</a>
        </nav>
        <Link className="button secondary" href="/login">
          Entrar <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="conteudo">
        <section className="hero">
          <div>
            <span className="eyebrow">
              <span className="dot" /> INTELIGÊNCIA DO CONHECIMENTO
            </span>
            <h1>
              O conhecimento da sua empresa.
              <br />
              <em>Na resposta certa.</em>
            </h1>
            <p>
              Conecte seus documentos, encontre respostas com fontes e descubra
              o que sua equipe ainda precisa documentar. Tudo em um só lugar.
            </p>
            <div className="actions">
              <Link className="button" href="/signup">
                Começar gratuitamente <ArrowUpRight size={18} />
              </Link>
              <a className="text-link" href="#como-funciona">
                Conhecer a plataforma →
              </a>
            </div>
            <div className="hero-notes">
              <span>
                <Check size={14} /> Sem cartão de crédito
              </span>
              <span>
                <Check size={14} /> Feito para trabalhar em português
              </span>
            </div>
          </div>
          <div
            className="knowledge-visual"
            aria-label="Documentos conectados a um núcleo de conhecimento"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="visual-core">
              <Layers3 size={66} />
              <span>
                CONHECIMENTO
                <br />
                CONECTADO
              </span>
            </div>
            <span className="visual-node node-one">
              <BookOpen /> Documentos
            </span>
            <span className="visual-node node-two">
              <ScanSearch /> Evidências
            </span>
            <span className="visual-node node-three">
              <Sparkles /> Respostas
            </span>
            <span className="visual-node node-four">
              <Network /> Sua equipe
            </span>
            <div className="visual-caption">
              Da informação dispersa à resposta rastreável.
            </div>
          </div>
        </section>
        <section className="section" id="como-funciona">
          <span className="eyebrow">MENOS PROCURA. MAIS CLAREZA.</span>
          <h2>Seu conhecimento começa a trabalhar.</h2>
          <div className="grid three">
            {[
              [
                "01",
                "Adicione suas fontes",
                "Importe PDF, DOCX, texto ou uma página pública. O conteúdo fica organizado no espaço da sua empresa.",
              ],
              [
                "02",
                "Crie seu agente",
                "Dê um nome e defina o objetivo. Faça perguntas à documentação em uma conversa privada.",
              ],
              [
                "03",
                "Confira as evidências",
                "Leia os trechos que sustentam a resposta, com documento, versão e página quando disponível.",
              ],
            ].map(([n, t, d]) => (
              <article className="card" key={n}>
                <span className="step">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section feature-section" id="recursos">
          <div>
            <span className="eyebrow">UMA BASE. NOVAS POSSIBILIDADES.</span>
            <h2>
              Respostas que você
              <br />
              pode conferir.
            </h2>
            <p>
              O SivirinIA prioriza a origem da informação. Quando não encontra
              evidência, informa a limitação.
            </p>
            <Link className="text-link" href="/seguranca">
              Conheça os controles de segurança →
            </Link>
          </div>
          <div className="grid two">
            {[
              [
                BookOpen,
                "Fontes organizadas",
                "Conteúdo pesquisável, identificação de duplicatas e exclusão dos índices.",
              ],
              [
                ScanSearch,
                "Referências rastreáveis",
                "Trechos reais, identificação do documento e páginas de PDFs.",
              ],
              [
                ShieldCheck,
                "Espaços isolados",
                "Permissões e políticas de acesso aplicadas no banco de dados.",
              ],
              [
                Sparkles,
                "Visibilidade do uso",
                "Histórico de consultas e identificação de perguntas sem evidência.",
              ],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof BookOpen;
              return (
                <article className="feature-card" key={String(t)}>
                  <I size={24} />
                  <h3>{t as string}</h3>
                  <p>{d as string}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="section" id="precos">
          <span className="eyebrow">COMECE PEQUENO. EVOLUA COM SUA BASE.</span>
          <h2>Um plano para cada etapa.</h2>
          <p className="muted">
            Planos comerciais propostos. Cobrança e contratação ainda não estão
            disponíveis.
          </p>
          <div className="grid four">
            {[
              ["Gratuito", "0", "1 agente", "50 páginas", "50 consultas/mês"],
              [
                "Essencial",
                "97",
                "1 agente",
                "2.000 páginas",
                "1.000 consultas/mês",
              ],
              [
                "Profissional",
                "297",
                "3 agentes",
                "10.000 páginas",
                "5.000 consultas/mês",
              ],
              [
                "Empresarial",
                "897",
                "10 agentes",
                "50.000 páginas",
                "20.000 consultas/mês",
              ],
            ].map(([name, price, ...features]) => (
              <article
                className={`card price ${name === "Profissional" ? "featured" : ""}`}
                key={name}
              >
                <h3>{name}</h3>
                <p className="price-number">
                  <small>R$</small> {price}
                  <small>/mês</small>
                </p>
                <ul>
                  {features.map((f) => (
                    <li key={f}>
                      <Check size={16} />
                      {f}
                    </li>
                  ))}
                </ul>
                {name === "Gratuito" ? (
                  <Link className="button secondary" href="/signup">
                    Criar conta gratuita
                  </Link>
                ) : (
                  <span className="badge">Em preparação</span>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="cta section">
          <span className="eyebrow">
            O PRÓXIMO PASSO ESTÁ NA SUA DOCUMENTAÇÃO.
          </span>
          <h2>
            Dê uma nova voz
            <br />
            ao que sua empresa sabe.
          </h2>
          <Link className="button" href="/signup">
            Criar meu espaço <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="footer">
        <Brand />
        <span>Conhecimento com evidência.</span>
        <nav>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/seguranca">Segurança</Link>
        </nav>
      </footer>
    </>
  );
}
