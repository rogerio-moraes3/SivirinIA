import { roleLabels } from "@/lib/roles";
import { requireOrg } from "@/lib/access";
import { ingestSource, deleteSource, setSourceRoles } from "@/lib/actions";
import { Form } from "@/components/forms";
import { PageTitle, Empty, date } from "@/components/ui";
export default async function Sources({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ q?: string; source?: string; kind?: string }>;
}) {
  const { org } = await params;
  const { q, source, kind } = await searchParams;
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
  return (
    <>
      <PageTitle
        eyebrow="BASE DE CONHECIMENTO"
        title="A fonte de boas respostas."
        description="Documentos reais, organizados e pesquisáveis no seu espaço."
      />
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
            </p>
          ))}
          {write && sources?.[0] && (
            <details className="citation">
              <summary>Atualizar esta fonte</summary>
              <p>
                A atualização substitui os trechos pesquisáveis e registra uma
                nova versão. O histórico registra metadados; arquivos originais
                não são armazenados.
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
