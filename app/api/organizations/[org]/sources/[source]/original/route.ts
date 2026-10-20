import { requireOrg } from "@/lib/access";
import { z } from "zod";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ org: string; source: string }> },
) {
  const { org, source } = await params;
  const revision = z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .safeParse(new URL(request.url).searchParams.get("version"));
  if (!z.uuid().safeParse(source).success || !revision.success)
    return new Response("Documento inválido", { status: 400 });
  const { db } = await requireOrg(org);
  const { data, error } = await db.rpc("get_document_original", {
    org,
    source,
    revision: revision.data,
  });
  if (error || !data)
    return new Response("Arquivo indisponível", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  const filename = String(data.filename).replace(/[\\/\r\n"\x00-\x1f]/g, "_");
  return new Response(Buffer.from(data.base64, "base64"), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
