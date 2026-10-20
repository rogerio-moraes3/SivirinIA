import { requireOrg } from "@/lib/access";
import { reportPeriod } from "@/lib/report-period";
import { loadKnowledgeReport } from "@/lib/reports";
import { knowledgeReportPdf } from "@/lib/report-pdf";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const { db, organization } = await requireOrg(org);
  const query = new URL(request.url).searchParams;
  const period = reportPeriod(query.get("from"), query.get("to"));
  if (period.error)
    return Response.json({ error: period.error }, { status: 400 });
  try {
    const { rows, report } = await loadKnowledgeReport(db, org, period);
    const bytes = await knowledgeReportPdf(
      organization.name,
      period.label,
      rows,
      report,
    );
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="sivirinia-relatorio.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Falha ao gerar relatório." },
      { status: 500 },
    );
  }
}
