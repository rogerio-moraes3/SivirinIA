import { roleLabels } from "@/lib/roles";
import Link from "next/link";
import {
  LayoutDashboard,
  Bot,
  Database,
  MessagesSquare,
  ScanSearch,
  Settings,
  CreditCard,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { requireOrg } from "@/lib/access";
import { logout } from "@/lib/actions";
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const { organization, user, member } = await requireOrg(org);
  const base = `/workspace/${org}`;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/">
          <Brand />
        </Link>
        <Link className="workspace-switch" href="/workspace">
          <span className="org-avatar">
            {organization.name.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{organization.name}</strong>
            <small>Trocar espaço ↗</small>
          </span>
        </Link>
        <span className="nav-label">ESPAÇO DE TRABALHO</span>
        <nav aria-label="Espaço de trabalho">
          {[
            [LayoutDashboard, "Visão geral", ""],
            [Bot, "Meus agentes", "/agents"],
            [Database, "Base de conhecimento", "/sources"],
            [MessagesSquare, "Conversar com a base", "/chat"],
            [MessagesSquare, "Conversas", "/conversations"],
            [ScanSearch, "Inteligência", "/intelligence"],
          ].map(([Icon, label, path]) => {
            const I = Icon as typeof Bot;
            return (
              <Link key={String(label)} href={base + path}>
                <I size={18} />
                {label as string}
              </Link>
            );
          })}
        </nav>
        <span className="nav-label">ORGANIZAÇÃO</span>
        <nav>
          {[
            [Users, "Equipe", "/team"],
            [CreditCard, "Plano e consumo", "/billing"],
            [Settings, "Configurações", "/settings"],
          ].map(([Icon, label, path]) => {
            const I = Icon as typeof Bot;
            return (
              <Link key={String(label)} href={base + path}>
                <I size={18} />
                {label as string}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <span className="dot" />
            {organization.plans.name}
            <small>Seu conhecimento, com controle.</small>
            <Link href={base + "/billing"}>
              Ver consumo <ArrowUpRight size={14} />
            </Link>
          </div>
          <span className="user-email">{user.email}</span>
          <small className="muted">Perfil: {roleLabels[member.role]}</small>
          <form action={logout}>
            <button className="text-button">Sair da conta</button>
          </form>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <span>Seu espaço de conhecimento</span>
          <span className="badge">{organization.name}</span>
        </header>
        <main id="conteudo" className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
