import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "SivirinIA — Conhecimento com evidência",
    template: "%s | SivirinIA",
  },
  description: brand.description,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip" href="#conteudo">
          Pular para conteúdo
        </a>
        {process.env.APP_ENV === "staging" && (
          <aside
            style={{
              background: "#10254a",
              color: "#fff",
              padding: "12px",
              textAlign: "center",
            }}
          >
            Homologação SivirinIA — use apenas dados de teste. Busca documental
            com fontes; IA paga desativada.
          </aside>
        )}
        {children}
      </body>
    </html>
  );
}
