import "server-only";
import type { supabase } from "./supabase/server";
import { analyzeKnowledge, type AnswerRecord } from "./analytics";
import type { ReportPeriod } from "./report-period";
export async function loadKnowledgeReport(
  db: Awaited<ReturnType<typeof supabase>>,
  org: string,
  period: ReportPeriod,
) {
  if (period.error) throw new Error(period.error);
  const answersQuery = db
    .from("messages")
    .select(
      "id,reply_to,mode,status,created_at,citations,input_tokens,output_tokens,cost_usd,model",
    )
    .eq("organization_id", org)
    .eq("role", "assistant")
    .order("sequence", { ascending: false })
    .limit(1000);
  const questionsQuery = db
    .from("messages")
    .select("id,content")
    .eq("organization_id", org)
    .eq("role", "user")
    .order("sequence", { ascending: false })
    .limit(1000);
  const feedbackQuery = db
    .from("feedback")
    .select("helpful,messages!inner(created_at)")
    .eq("organization_id", org);
  if (period.fromISO) {
    answersQuery.gte("created_at", period.fromISO);
    questionsQuery.gte("created_at", period.fromISO);
    feedbackQuery.gte("messages.created_at", period.fromISO);
  }
  if (period.untilISO) {
    answersQuery.lt("created_at", period.untilISO);
    questionsQuery.lt("created_at", period.untilISO);
    feedbackQuery.lt("messages.created_at", period.untilISO);
  }
  const [answers, questions, feedback, sources] = await Promise.all([
    answersQuery,
    questionsQuery,
    feedbackQuery,
    db
      .from("knowledge_source_health")
      .select("id,title,updated_at,needs_review")
      .eq("organization_id", org),
  ]);
  if ([answers, questions, feedback, sources].some((r) => r.error))
    throw new Error("Não foi possível carregar o relatório. Tente novamente.");
  const rows = (answers.data || []) as AnswerRecord[];
  return {
    rows,
    report: analyzeKnowledge(rows, questions.data || []),
    feedback: feedback.data || [],
    sources: sources.data || [],
  };
}
