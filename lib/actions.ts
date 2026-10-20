"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { supabase } from "./supabase/server";
import { requireUser, requireOrg } from "./access";
import { chunkPages, contentHash, MAX_CHARS, type Evidence } from "./knowledge";
import { MAX_BYTES } from "./documents";
import { importUrl } from "./crawler";
import { enrichChunks, embedTexts, answerQuestion } from "./ai";
export type ActionState = { error?: string; success?: string };
function errorState(error: unknown): ActionState {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível concluir a operação.";
  if (
    message.includes("NEXT_REDIRECT") ||
    message.includes("NEXT_HTTP_ERROR_FALLBACK")
  )
    throw error;
  // Do not surface SQL diagnostics, provider bodies, tokens or connection details.
  const safe = [
    "Limite",
    "limite",
    "Sem permissão",
    "perfil",
    "inválid",
    "suportado",
    "Documento",
    "documento",
    "arquivo",
    "Arquivo",
    "PDF",
    "DOCX",
    "Página",
    "página",
    "URL",
    "HTTPS",
    "domínio",
    "rede",
    "robots",
    "redirecionamento",
    "Redirecionamento",
    "Tempo",
    "vazio",
    "texto",
    "caracteres",
    "fragmentos",
    "Muitas perguntas",
    "Fonte",
    "Agente",
    "Conversa",
    "Mensagem",
    "Citações",
    "Conteúdo",
    "provedor",
    "Pergunta",
    "Confirmação",
    "Selecione",
  ];
  if (message.includes("duplicate key"))
    return { error: "Este conteúdo já foi importado nesta organização." };
  return {
    error: safe.some((s) => message.includes(s))
      ? message
      : "Não foi possível concluir. Verifique os dados e tente novamente.",
  };
}
function checked(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
export async function login(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(8).max(128) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Informe um e-mail válido e senha com pelo menos 8 caracteres.",
    };
  const db = await supabase();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error: "E-mail ou senha incorretos, ou e-mail ainda não confirmado.",
    };
  redirect("/workspace");
}
export async function signup(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(12).max(128) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Use um e-mail válido e senha com pelo menos 12 caracteres.",
    };
  const db = await supabase();
  const origin = (await headers()).get("origin");
  const { data, error } = await db.auth.signUp({
    ...parsed.data,
    options: origin
      ? { emailRedirectTo: `${origin}/auth/callback` }
      : undefined,
  });
  if (error)
    return {
      error:
        "Não foi possível criar a conta. Confira seus dados ou tente recuperar a senha.",
    };
  if (data.session) redirect("/workspace");
  return {
    success: "Confira sua caixa de entrada para confirmar o e-mail e entrar.",
  };
}
export async function logout() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/login");
}
export async function recover(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { error: "Informe um e-mail válido." };
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return { error: "Reabra esta página pelo navegador." };
  const db = await supabase();
  await db.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  return {
    success:
      "Se houver uma conta para este e-mail, enviaremos as instruções de recuperação.",
  };
}
export async function resetPassword(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const password = z.string().min(12).max(128).safeParse(form.get("password"));
  if (!password.success) return { error: "Use pelo menos 12 caracteres." };
  const { db } = await requireUser();
  const { error } = await db.auth.updateUser({ password: password.data });
  if (error)
    return {
      error: "Link inválido ou expirado. Solicite uma nova recuperação.",
    };
  redirect("/workspace");
}
export async function createOrganization(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const name = z.string().trim().min(2).max(100).safeParse(form.get("name"));
  if (!name.success)
    return { error: "Informe um nome entre 2 e 100 caracteres." };
  const { db } = await requireUser();
  const { data, error } = await db.rpc("create_organization", {
    org_name: name.data,
  });
  if (error) return errorState(error);
  redirect(`/workspace/${data}`);
}
export async function saveAgent(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org, true);
    const input = z
      .object({
        name: z.string().trim().min(2).max(100),
        description: z.string().max(1000),
        instructions: z.string().max(4000),
      })
      .parse(Object.fromEntries(form));
    const { error } = await db.rpc("save_agent", {
      org,
      agent_name: input.name,
      agent_description: input.description,
      agent_instructions: input.instructions,
      agent: form.get("agent") ? z.uuid().parse(form.get("agent")) : null,
    });
    checked(error);
    revalidatePath(`/workspace/${org}`, "layout");
    return {
      success: form.get("agent")
        ? "Agente atualizado."
        : "Agente criado. Abra o chat para testar com suas fontes.",
    };
  } catch (error) {
    return errorState(error);
  }
}
export async function ingestSource(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  let ingestionJob: string | undefined;
  try {
    const { db } = await requireOrg(org, true);
    const mode = form.get("mode");
    const sourceId = form.get("source")
      ? z.uuid().parse(form.get("source"))
      : null;
    if (mode !== "url") {
      const ocrRequested = form.get("ocr") === "on";
      let bytes: Buffer;
      let filename: string;
      const titleInput = String(form.get("title") || "").trim();
      if (mode === "file") {
        const file = form.get("file");
        if (!(file instanceof File) || !file.size || file.size > MAX_BYTES)
          throw new Error("Arquivo inválido: limite de 10 MB.");
        filename = file.name.replace(/[\\/\r\n]/g, "_").slice(0, 250);
        if (!/\.(pdf|docx|txt|md|csv|html|png|jpg|jpeg)$/i.test(filename))
          throw new Error("Formato de arquivo não suportado.");
        bytes = Buffer.from(await file.arrayBuffer());
      } else if (mode === "text") {
        const text = z
          .string()
          .trim()
          .min(1)
          .max(MAX_CHARS)
          .parse(form.get("content"));
        bytes = Buffer.from(text, "utf8");
        filename = "conteudo.txt";
      } else throw new Error("Formato inválido.");
      const title = z
        .string()
        .trim()
        .min(1)
        .max(250)
        .parse(titleInput || filename);
      const { error } = await db.rpc("enqueue_document_with_ocr", {
        org,
        source_title: title,
        filename,
        input_mode: mode,
        ocr_requested: ocrRequested,
        input_base64: bytes.toString("base64"),
        source: sourceId,
      });
      checked(error);
      revalidatePath(`/workspace/${org}`, "layout");
      return {
        success:
          "Documento na fila. Acompanhe o processamento abaixo; a fonte aparecerá após a indexação.",
      };
    }
    const result = await importUrl(String(form.get("url")));
    const pages = result.pages;
    const kind = "url";
    const origin = result.url;
    let title = String(form.get("title") || "").trim() || result.title;
    title = z.string().trim().min(1).max(250).parse(title);
    const chars = pages.reduce((n, p) => n + p.text.length, 0);
    if (chars > MAX_CHARS)
      throw new Error("Documento excede 2 milhões de caracteres.");
    const chunks = chunkPages(pages);
    // Mirror the database: quota includes stored overlap and physical PDF page positions.
    const indexedChars = chunks.reduce((n, c) => n + c.content.length, 0);
    const pageCount = Math.max(1, Math.ceil(indexedChars / 3000), 1);
    // Check quota before a potentially billed embedding request; DB rechecks under lock.
    const { data: organization } = await db
      .from("organizations")
      .select("plans(page_limit)")
      .eq("id", org)
      .single();
    const { data: sources } = await db
      .from("knowledge_sources")
      .select("id,page_count,content_hash")
      .eq("organization_id", org);
    const hash = contentHash(pages);
    if (sources?.some((s) => s.content_hash === hash))
      return { error: "Este conteúdo já foi importado nesta organização." };
    const plan = organization?.plans as unknown as {
      page_limit: number;
    } | null;
    if (
      !plan ||
      pageCount +
        (sources || [])
          .filter((s) => s.id !== sourceId)
          .reduce((n, s) => n + s.page_count, 0) >
        plan.page_limit
    )
      throw new Error("Limite de páginas atingido.");
    const { data: job, error: jobError } = await db.rpc("reserve_ingestion", {
      org,
      hash,
      pages: pageCount,
      source: sourceId,
    });
    checked(jobError);
    ingestionJob = job;
    await enrichChunks(chunks);
    const { error } = await db.rpc("ingest_source", {
      org,
      source_title: title,
      source_kind: kind,
      source_url: origin,
      hash,
      pages: pageCount,
      chars,
      chunks,
      source: sourceId,
    });
    checked(error);
    await db.rpc("finish_ingestion", { job: ingestionJob, succeeded: true });
    revalidatePath(`/workspace/${org}`, "layout");
    return {
      success: `Fonte indexada: ${chunks.length} trechos pesquisáveis.`,
    };
  } catch (error) {
    if (ingestionJob) {
      const { db } = await requireOrg(org);
      await db.rpc("finish_ingestion", { job: ingestionJob, succeeded: false });
    }
    return errorState(error);
  }
}
export async function deleteSource(org: string, form: FormData) {
  const { db } = await requireOrg(org, true);
  const source = z.uuid().parse(form.get("source"));
  const { error } = await db.rpc("delete_source", { org, source });
  checked(error);
  revalidatePath(`/workspace/${org}`, "layout");
}
export type ChatState = ActionState & {
  conversationId?: string;
  answer?: string;
  mode?: string;
  citations?: import("./knowledge").Citation[];
};
export async function askQuestion(
  org: string,
  state: ChatState,
  form: FormData,
): Promise<ChatState> {
  let messageId: string | undefined;
  let conversationId: string | undefined;
  const start = Date.now();
  try {
    const { db } = await requireOrg(org);
    const input = z
      .object({ agent: z.uuid(), question: z.string().trim().min(2).max(2000) })
      .parse(Object.fromEntries(form));
    const { data: agent } = await db
      .from("agents")
      .select("*")
      .eq("organization_id", org)
      .eq("id", input.agent)
      .single();
    if (!agent) throw new Error("Agente não encontrado.");
    const { data: reservation, error } = await db.rpc("reserve_question", {
      org,
      agent: input.agent,
      question: input.question,
      conversation: state.conversationId || null,
    });
    checked(error);
    messageId = reservation.message_id;
    conversationId = reservation.conversation_id;
    const vectors = await embedTexts([input.question]);
    const { data: rows, error: searchError } = await db.rpc(
      "search_agent_knowledge",
      {
        org,
        agent: input.agent,
        query: input.question,
        query_embedding: vectors?.[0] || null,
        model_name: process.env.AI_EMBEDDING_MODEL || null,
      },
    );
    checked(searchError);
    const { data: priorQuestions } = await db
      .from("messages")
      .select("content")
      .eq("organization_id", org)
      .eq("conversation_id", conversationId)
      .eq("role", "user")
      .order("sequence", { ascending: false })
      .limit(5);
    const result = await answerQuestion(
      input.question,
      (rows || []) as Evidence[],
      agent.instructions,
      (priorQuestions || [])
        .slice(1)
        .reverse()
        .map((m) => m.content),
    );
    const { error: saveError } = await db.rpc("finish_answer", {
      message: messageId,
      answer: result.text,
      answer_mode: result.mode,
      refs: result.citations,
      in_tokens: result.inputTokens,
      out_tokens: result.outputTokens,
      model_name: result.model,
      cost: result.cost,
      elapsed: Date.now() - start,
    });
    checked(saveError);
    revalidatePath(`/workspace/${org}`, "layout");
    return {
      conversationId,
      answer: result.text,
      mode: result.mode,
      citations: result.citations,
    };
  } catch (error) {
    if (messageId) {
      const { db } = await requireOrg(org);
      await db.rpc("finish_answer", {
        message: messageId,
        answer: "A consulta falhou. Tente novamente mais tarde.",
        answer_mode: "abstention",
        refs: [],
        failed: true,
        elapsed: Date.now() - start,
      });
    }
    return { ...errorState(error), conversationId };
  }
}
export async function submitFeedback(org: string, form: FormData) {
  const { db, user } = await requireOrg(org);
  const message = z.uuid().parse(form.get("message"));
  const helpful = form.get("helpful") === "true";
  const { error } = await db
    .from("feedback")
    .upsert(
      { organization_id: org, message_id: message, user_id: user.id, helpful },
      { onConflict: "message_id,user_id" },
    );
  checked(error);
  revalidatePath(`/workspace/${org}/conversations`);
}
export async function inviteMember(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org);
    const input = z
      .object({
        email: z.email(),
        role: z.enum(["admin", "editor", "analyst", "viewer"]),
      })
      .parse(Object.fromEntries(form));
    const { data, error } = await db.rpc("invite_member", {
      org,
      member_email: input.email,
      member_role: input.role,
    });
    checked(error);
    revalidatePath(`/workspace/${org}/team`);
    return {
      success: `Convite criado. Envie este código à pessoa por um canal privado: ${data}. Validade: 7 dias. Ela pode aceitá-lo na página de espaços de trabalho.`,
    };
  } catch (error) {
    return errorState(error);
  }
}
export async function acceptInvitation(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const token = z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .safeParse(form.get("token"));
  if (!token.success) return { error: "Código de convite inválido." };
  const { db } = await requireUser();
  const { data, error } = await db.rpc("accept_invitation", {
    invite_token: token.data,
  });
  if (error)
    return {
      error:
        "Convite inválido, expirado ou destinado a outro e-mail. Confirme sua conta antes de aceitar.",
    };
  redirect(`/workspace/${data}`);
}
export async function renameOrganization(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org);
    const name = z.string().trim().min(2).max(100).parse(form.get("name"));
    const { error } = await db.rpc("rename_organization", {
      org,
      new_name: name,
    });
    checked(error);
    revalidatePath(`/workspace/${org}`, "layout");
    return { success: "Nome atualizado." };
  } catch (error) {
    return errorState(error);
  }
}
export async function changeRole(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org);
    const input = z
      .object({
        member: z.uuid(),
        role: z.enum(["admin", "editor", "analyst", "viewer"]),
      })
      .parse(Object.fromEntries(form));
    const { error } = await db.rpc("change_member_role", {
      org,
      member: input.member,
      new_role: input.role,
    });
    checked(error);
    revalidatePath(`/workspace/${org}/team`);
    return { success: "Perfil atualizado." };
  } catch (error) {
    return errorState(error);
  }
}

export async function deleteAgent(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org, true);
    const agent = z.uuid().parse(form.get("agent"));
    if (form.get("confirm") !== "on")
      return { error: "Confirme a exclusão do agente e suas conversas." };
    const { error } = await db.rpc("delete_agent", { org, agent });
    checked(error);
    revalidatePath(`/workspace/${org}`, "layout");
    return { success: "Agente e conversas excluídos." };
  } catch (error) {
    return errorState(error);
  }
}
export async function setSourceRoles(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org);
    const source = z.uuid().parse(form.get("source"));
    const roles = z
      .array(z.enum(["owner", "admin", "editor", "analyst", "viewer"]))
      .parse(form.getAll("roles"));
    const { error } = await db.rpc("set_source_roles", { org, source, roles });
    checked(error);
    revalidatePath(`/workspace/${org}`, "layout");
    return { success: "Permissões da fonte atualizadas." };
  } catch (error) {
    return errorState(error);
  }
}
export async function configureAgentSources(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org, true);
    const agent = z.uuid().parse(form.get("agent"));
    const sources = z.array(z.uuid()).max(500).parse(form.getAll("sources"));
    const { error } = await db.rpc("configure_agent_sources", {
      org,
      agent,
      all_sources: form.get("all_sources") === "on",
      sources,
    });
    checked(error);
    revalidatePath(`/workspace/${org}`, "layout");
    return { success: "Fontes do agente atualizadas." };
  } catch (error) {
    return errorState(error);
  }
}
export async function deleteOrganization(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org);
    const confirmation = z
      .string()
      .min(2)
      .max(100)
      .parse(form.get("confirmation"));
    if (form.get("confirm") !== "on")
      return { error: "Confirme a exclusão permanente da organização." };
    const { error } = await db.rpc("delete_organization", {
      org,
      confirmation,
    });
    checked(error);
  } catch (error) {
    return errorState(error);
  }
  redirect("/workspace");
}
export type PublicationState = ActionState & { token?: string };
export async function publishAgent(
  org: string,
  _state: PublicationState,
  form: FormData,
): Promise<PublicationState> {
  try {
    const { db } = await requireOrg(org);
    const agent = z.uuid().parse(form.get("agent"));
    const sources = z
      .array(z.uuid())
      .min(1)
      .max(100)
      .parse(form.getAll("sources"));
    if (form.get("consent") !== "on")
      return {
        error: "Confirme que as fontes selecionadas podem ser públicas.",
      };
    const { data, error } = await db.rpc("publish_agent", {
      org,
      agent,
      sources,
      acknowledgement: form.get("acknowledgement"),
    });
    checked(error);
    revalidatePath(`/workspace/${org}/agents`);
    return {
      success:
        "Link ativado. Guarde o link: o token não será exibido novamente após sair desta página.",
      token: data,
    };
  } catch (error) {
    return errorState(error);
  }
}
export async function revokePublication(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org);
    const agent = z.uuid().parse(form.get("agent"));
    const { error } = await db.rpc("revoke_publication", { org, agent });
    checked(error);
    revalidatePath(`/workspace/${org}/agents`);
    return {
      success:
        "Publicação revogada. O link antigo não permite novas consultas.",
    };
  } catch (error) {
    return errorState(error);
  }
}
export async function askPublicQuestion(
  token: string,
  _state: ChatState,
  form: FormData,
): Promise<ChatState> {
  try {
    z.string()
      .regex(/^[a-f0-9]{64}$/)
      .parse(token);
    const question = z
      .string()
      .trim()
      .min(2)
      .max(2000)
      .parse(form.get("question"));
    const db = await supabase();
    const { error } = await db.rpc("reserve_public_question", {
      access_token: token,
      question,
    });
    checked(error);
    const embedding = await embedTexts([question]);
    const { data: rows, error: searchError } = await db.rpc(
      "search_public_knowledge",
      {
        access_token: token,
        query: question,
        query_embedding: embedding?.[0] || null,
        model_name: process.env.AI_EMBEDDING_MODEL || null,
      },
    );
    checked(searchError);
    const result = await answerQuestion(
      question,
      (rows || []) as Evidence[],
      "",
    );
    const { data: stillPublished } = await db.rpc("public_agent_info", {
      access_token: token,
    });
    if (!stillPublished) return { error: "Agente público indisponível." };
    return {
      answer: result.text,
      mode: result.mode,
      citations: result.citations,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function cancelDocumentTask(org: string, form: FormData) {
  const { db } = await requireOrg(org, true);
  const task = z.uuid().parse(form.get("task"));
  const { error } = await db.rpc("cancel_document_task", { org, task });
  checked(error);
  revalidatePath(`/workspace/${org}/sources`);
}
export async function retryDocumentTask(
  org: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireOrg(org, true);
    const task = z.uuid().parse(form.get("task"));
    const { error } = await db.rpc("retry_document_task", { org, task });
    checked(error);
    revalidatePath(`/workspace/${org}/sources`);
    return { success: "Documento reenviado à fila." };
  } catch (error) {
    return errorState(error);
  }
}
