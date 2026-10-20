import { TaskRefresh } from "@/components/task-refresh";
import { roleLabels } from "@/lib/roles";
import { requireOrg } from "@/lib/access";
import {
  ingestSource,
  deleteSource,
  setSourceRoles,
  cancelDocumentTask,
  retryDocumentTask,
} from "@/lib/actions";
import { Form } from "@/components/forms";
import { PageTitle, Empty, date } from "@/components/ui";
export default async function Sources({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{
    q?: string;
    source?: string;
    kind?: string;
    revision?: string;
  }>;
}) {
  const { org } = await params;
  const { q, source, kind, revision } = await searchParams;
  const { db, member } = await requireOrg(org);
  const write = ["owner", "admin", "editor"].includes(member.role);
  let query = db
    .from("knowledge_sources")
    .select("*")
    .eq("organization_id", org)
    .order("updated_at", { ascending: false });
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  if (kind) query = query.eq("kind", kind);
  if (source) query = query.eq("id", source);
  const { data: sources } = await query;
  const { data: chunks } = source
    ? await db
        .from("document_chunks")
        .select("id,content,page,position")
        .eq("organization_id", org)
        .eq("source_id", source)
        .order("position")
        .limit(100)
    : { data: null };
  const { data: versions } = source
    ? await db
        .from("source_versions")
        .select("id,version,created_at,page_count")
        .eq("organization_id", org)
        .eq("source_id", source)
        .order("version", { ascending: false })
    : { data: null };
  const { data: tasks } = write
    ? await db
        .from("document_tasks")
        .select("id,title,status,attempts,error_code,source_id")
        .eq("organization_id", org)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: null };
  const { data: snapshots } = source
    ? await db
        .from("document_snapshots")
        .select("version,filename")
        .eq("organization_id", org)
        .eq("source_id", source)
    : { data: null };
  const selectedRevision =
    revision && /^\d+$/.test(revision) ? Number(revision) : null;
  const { data: historicalPages } =
    source && selectedRevision
      ? await db.rpc("get_document_version", {
          org,
          source,
          revision: selectedRevision,
        })
      : { data: null };
  const taskLabels: Record<string, string> = {
    queued: "Na fila",
    processing: "Processando",
    retry: "Aguardando nova tentativa",
    complete: "Concluída",
    failed: "Falhou",
    cancelled: "Cancelada",
  };
  const errorLabels: Record<string, string> = {
    invalid_document: "Documento inválido ou sem texto; verifique o arquivo.",
    worker_timeout: "Tempo de processamento excedido.",
    quota_exceeded: "Limite de páginas, armazenamento ou versões atingido.",
    duplicate: "Este conteúdo já foi importado.",
    access_revoked: "Permissão de edição revogada.",
    version_conflict:
      "Fonte alterada durante o processamento; envie novamente.",
    internal_error: "Falha interna; nova tentativa controlada.",
    network_unavailable: "Rede indisponível.",
  };
  return (
    <>
      <PageTitle
        eyebrow="BASE DE CONHECIMENTO"
        title="A fonte de boas respostas."
        description="Documentos reais, organizados e pesquisáveis no seu espaço."
      />
      {write && (
        <section className="card" aria-label="Processamento de documentos">
          <h2>Processamento de documentos</h2>
          <p>
            Originais privados. Extração em segundo plano, com até três
            tentativas. Limite de 10 MB por arquivo e 20 versões por fonte.
          </p>
          <TaskRefresh
            active={Boolean(
              tasks?.some((t) =>
                ["queued", "processing", "retry"].includes(t.status),
              ),
            )}
          />
          {!tasks?.length && <p className="muted">Nenhuma tarefa enviada.</p>}
          {tasks?.map((t) => (
            <div className="citation" key={t.id} data-testid="document-task">
              <strong>{t.title}</strong> · {taskLabels[t.status]} · Tentativa{" "}
              {t.attempts}/3
              {t.error_code && (
                <p>{errorLabels[t.error_code] || "Falha de processamento."}</p>
              )}
              {t.status === "complete" && t.source_id && (
                <a href={`?source=${t.source_id}`}>Abrir fonte processada</a>
              )}
              {["queued", "processing", "retry", "failed"].includes(
                t.status,
              ) && (
                <form action={cancelDocumentTask.bind(null, org)}>
                  <input type="hidden" name="task" value={t.id} />
                  <button className="text-button danger">
                    Cancelar e descartar original pendente
                  </button>
                </form>
              )}
              {t.status === "failed" && t.attempts < 3 && (
                <Form
                  action={retryDocumentTask.bind(null, org)}
                  label="Tentar novamente"
                >
                  <input type="hidden" name="task" value={t.id} />
                </Form>
              )}
            </div>
          ))}
        </section>
      )}
      <form className="search-bar">
        <input
          name="q"
          defaultValue={q}
          placeholder="Pesquisar por título"
          aria-label="Pesquisar fontes"
        />
        <select name="kind" defaultValue={kind || ""} aria-label="Formato">
          <option value="">Todos os formatos</option>
          {["pdf", "docx", "text", "markdown", "csv", "html", "url"].map(
            (k) => (
              <option key={k} value={k}>
                {k.toUpperCase()}
              </option>
            ),
          )}
        </select>
        <button className="button secondary">Buscar</button>
      </form>
      {sources?.length ? (
        <section className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Formato</th>
                <th>Páginas*</th>
                <th>Atualizada</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td>
                    <a href={`?source=${s.id}`}>
                      <strong>{s.title}</strong>
                    </a>
                    <small className="block muted">
                      v{s.version} · Indexada
                    </small>
                  </td>
                  <td>{s.kind.toUpperCase()}</td>
                  <td>{s.page_count}</td>
                  <td>{date(s.updated_at)}</td>
                  <td>
                    {write && (
                      <form action={deleteSource.bind(null, org)}>
                        <input type="hidden" name="source" value={s.id} />
                        <button className="text-button danger">
                          Excluir fonte e índices
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <small>
            *Cota: maior valor entre páginas físicas do PDF e unidades de 3.000
            caracteres indexados, incluindo sobreposição dos trechos.
          </small>
        </section>
      ) : (
        <Empty
          title="Conhecimento começa aqui"
          description="Adicione a primeira fonte ou ajuste os filtros de pesquisa."
        />
      )}
      {chunks && (
        <section className="card">
          <h2>Trechos indexados</h2>
          <p className="muted">Até 100 trechos da fonte selecionada.</p>
          {chunks.map((c) => (
            <details className="citation" key={c.id}>
              <summary>
                Trecho {c.position + 1}
                {c.page ? ` · página ${c.page}` : ""}
              </summary>
              <p className="prewrap">{c.content}</p>
            </details>
          ))}
          {["owner", "admin"].includes(member.role) && sources?.[0] && (
            <details className="citation">
              <summary>Permissões desta fonte</summary>
              <p>
                Proprietários e administradores sempre têm acesso. Respostas
                derivadas são removidas dos históricos que perderem acesso.
              </p>
              <Form
                action={setSourceRoles.bind(null, org)}
                label="Salvar permissões"
              >
                <input type="hidden" name="source" value={source} />
                {["editor", "analyst", "viewer"].map((role) => (
                  <label className="check-label" key={role}>
                    <input
                      type="checkbox"
                      name="roles"
                      value={role}
                      defaultChecked={sources[0].allowed_roles.includes(role)}
                    />
                    {roleLabels[role]}
                  </label>
                ))}
              </Form>
            </details>
          )}
          <h3>Histórico de versões</h3>
          {versions?.map((v) => (
            <p key={v.id}>
              Versão {v.version} · {date(v.created_at)} · {v.page_count} páginas
              {snapshots?.some((s) => s.version === v.version) ? (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={`/api/organizations/${org}/sources/${source}/original?version=${v.version}`}
                  >
                    Baixar original v{v.version}
                  </a>{" "}
                  ·{" "}
                  <a href={`?source=${source}&revision=${v.version}`}>
                    Ler versão {v.version}
                  </a>
                </>
              ) : (
                " · Somente metadados (importação anterior à fila)"
              )}
            </p>
          ))}
          {Array.isArray(historicalPages) && (
            <section aria-label="Conteúdo histórico">
              <h3>Conteúdo integral da versão {selectedRevision}</h3>
              {historicalPages.map(
                (p: { text: string; page: number | null }, i: number) => (
                  <div className="citation" key={i}>
                    <strong>
                      {p.page ? `Página ${p.page}` : `Seção ${i + 1}`}
                    </strong>
                    <p className="prewrap">{p.text}</p>
                  </div>
                ),
              )}
            </section>
          )}
          {write && sources?.[0] && (
            <details className="citation">
              <summary>Atualizar esta fonte</summary>
              <p>
                A atualização substitui os trechos pesquisáveis e registra uma
                nova versão com conteúdo integral e original privado. Versões
                anteriores à fila podem conter somente metadados.
              </p>
              <Form
                action={ingestSource.bind(null, org)}
                label="Atualizar e reindexar"
              >
                <input type="hidden" name="source" value={source} />
                <label>
                  Modo de atualização
                  <select name="mode" defaultValue="text">
                    <option value="text">Texto</option>
                    <option value="file">Arquivo</option>
                    <option value="url">URL</option>
                  </select>
                </label>
                <label>
                  Título da atualização
                  <input
                    name="title"
                    defaultValue={sources[0].title}
                    maxLength={250}
                    required
                  />
                </label>
                <label>
                  Novo conteúdo
                  <textarea name="content" rows={5} maxLength={150000} />
                </label>
                <label>
                  Novo arquivo
                  <input
                    type="file"
                    name="file"
                    accept=".pdf,.docx,.txt,.md,.csv,.html"
                  />
                </label>
                <label>
                  Nova URL
                  <input
                    type="url"
                    name="url"
                    defaultValue={sources[0].origin_url || ""}
                  />
                </label>
              </Form>
            </details>
          )}
          <a href={`/workspace/${org}/sources`}>Ver todas as fontes</a>
        </section>
      )}
      {write && (
        <div className="grid two ingestion">
          <section className="card">
            <h2>Enviar documento</h2>
            <p>PDF com texto, DOCX, TXT, Markdown, CSV ou HTML. Até 10 MB.</p>
            <Form
              action={ingestSource.bind(null, org)}
              label="Importar documento"
            >
              <input type="hidden" name="mode" value="file" />
              <label>
                Título (opcional)
                <input name="title" maxLength={250} />
              </label>
              <label>
                Arquivo
                <input
                  type="file"
                  name="file"
                  required
                  accept=".pdf,.docx,.txt,.md,.csv,.html"
                />
              </label>
            </Form>
          </section>
          <section className="card">
            <h2>Importar página pública</h2>
            <p>
              Uma página por importação. Respeita robots.txt e bloqueia redes
              privadas.
            </p>
            <Form action={ingestSource.bind(null, org)} label="Importar página">
              <input type="hidden" name="mode" value="url" />
              <label>
                URL HTTPS
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://suaempresa.com/documentacao"
                />
              </label>
              <label>
                Título (opcional)
                <input name="title" maxLength={250} />
              </label>
            </Form>
          </section>
          <section className="card full">
            <h2>Adicionar texto ou FAQ</h2>
            <Form
              action={ingestSource.bind(null, org)}
              label="Indexar conteúdo"
            >
              <input type="hidden" name="mode" value="text" />
              <label>
                Título
                <input name="title" maxLength={250} required />
              </label>
              <label>
                Conteúdo
                <textarea
                  name="content"
                  rows={7}
                  required
                  maxLength={150000}
                  placeholder="Cole o texto autorizado que seu agente deve consultar."
                />
              </label>
            </Form>
          </section>
        </div>
      )}
    </>
  );
}
