import { requireOrg } from "@/lib/access";
import { csvCell } from "@/lib/csv";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const { db } = await requireOrg(org);
  const { data, error } = await db
    .from("messages")
    .select(
      "created_at,role,content,mode,status,input_tokens,output_tokens,cost_usd",
    )
    .eq("organization_id", org)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error)
    return Response.json({ error: "Falha ao exportar." }, { status: 500 });
  const columns = [
    "created_at",
    "role",
    "content",
    "mode",
    "status",
    "input_tokens",
    "output_tokens",
    "cost_usd",
  ];
  const rows = (data || []) as Record<string, unknown>[];
  const csv =
    "\uFEFF" +
    [
      columns.map(csvCell).join(","),
      ...rows.map((row) => columns.map((col) => csvCell(row[col])).join(",")),
    ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sivirinia-conversas.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
