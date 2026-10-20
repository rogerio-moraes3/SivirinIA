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
        {children}
      </body>
    </html>
  );
}
