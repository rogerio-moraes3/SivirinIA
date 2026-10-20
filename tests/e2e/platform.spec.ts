import { createServer } from "node:http";
import { test, expect } from "@playwright/test";
test("site comercial, rotas protegidas e layout mobile", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /O conhecimento da sua empresa/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Como funciona", exact: true }).click();
  await expect(page).toHaveURL(/#como-funciona/);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/site-mobile.png",
    fullPage: true,
  });
});
test("cadastro → organização → agente → documento → pergunta citada → histórico → exclusão", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@example.test`;
  await page.goto("/signup");
  await page.getByLabel("E-mail profissional").fill(email);
  await page
    .getByLabel("Senha", { exact: true })
    .fill("SivirinIA-test-password-2026");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.getByLabel("Nome da empresa").fill("Empresa de teste E2E");
  await page.getByRole("button", { name: "Criar espaço", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+$/);
  const base = new URL(page.url()).pathname;
  await page.goto(base + "/agents");
  await page.getByLabel("Nome", { exact: true }).fill("Especialista E2E");
  await page
    .getByLabel("Objetivo", { exact: true })
    .fill("Consultar política de reembolso.");
  await page.getByRole("button", { name: "Criar agente", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Agente criado");
  await page.goto(base + "/sources");
  const content =
    "O prazo de reembolso é de sete dias após a compra. O contato de suporte é suporte@example.test.";
  await page
    .getByLabel("Título", { exact: true })
    .fill("Política de reembolso E2E");
  await page.getByLabel("Conteúdo", { exact: true }).fill(content);
  await page.getByRole("button", { name: "Indexar conteúdo" }).click();
  await expect(page.getByRole("status")).toContainText("Fonte indexada");
  await page
    .getByLabel("Título", { exact: true })
    .fill("Política de reembolso E2E");
  await page.getByLabel("Conteúdo", { exact: true }).fill(content);
  await page.getByRole("button", { name: "Indexar conteúdo" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "já foi importado",
  );
  await page.goto(base + "/chat");
  await page.getByLabel("Sua pergunta").fill("Qual o prazo de reembolso?");
  await page.getByRole("button", { name: "Perguntar à base" }).click();
  await expect(page.locator("article.answer")).toContainText("sete dias");
  await expect(page.locator("article.answer .badge")).toContainText(
    "sem geração",
  );
  await page
    .getByText("[1] Política de reembolso E2E", { exact: false })
    .click();
  await expect(page.locator("blockquote")).toContainText(content);
  await page.getByLabel("Sua pergunta").fill("Qual o contato de suporte?");
  await page.getByRole("button", { name: "Perguntar à base" }).click();
  await expect(page.locator("article.answer")).toContainText(
    "suporte@example.test",
  );
  await page.getByRole("link", { name: /Ver conversa e avaliar/ }).click();
  await expect(page.locator(".message.assistant")).toHaveCount(2);
  await expect(page.locator(".message.assistant").first()).toContainText(
    "sete dias",
  );
  await page.getByRole("button", { name: "Sim", exact: true }).first().click();
  await page.goto(base + "/intelligence");
  await expect(
    page.getByRole("heading", { name: "Qualidade observada" }),
  ).toBeVisible();
  await expect(
    page.getByText("1 positivos, 0 negativos.", { exact: false }),
  ).toBeVisible();
  await page.goto(base + "/chat");
  await page
    .getByLabel("Sua pergunta")
    .fill("Qual a velocidade máxima do foguete lunar?");
  await page.getByRole("button", { name: "Perguntar à base" }).click();
  await expect(page.locator("article.answer")).toContainText(
    "Não encontrei uma resposta confiável",
  );
  await page.goto(base + "/sources");
  await page.getByRole("button", { name: "Excluir fonte e índices" }).click();
  await expect(
    page.getByRole("heading", { name: "Conhecimento começa aqui" }),
  ).toBeVisible();
  await page.goto(base);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("upload real de PDF, reindexação de texto e bloqueio de URL interna", async ({
  page,
}) => {
  await page.goto("/signup");
  await page
    .getByLabel("E-mail profissional")
    .fill(`upload-${Date.now()}@example.test`);
  await page
    .getByLabel("Senha", { exact: true })
    .fill("SivirinIA-upload-password-2026");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.getByLabel("Nome da empresa").fill("Upload teste E2E");
  await page.getByRole("button", { name: "Criar espaço", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+$/);
  const base = new URL(page.url()).pathname;
  await page.goto(base + "/sources");
  await page
    .getByLabel("Arquivo", { exact: true })
    .setInputFiles("tests/fixtures/policy.pdf");
  await page
    .getByRole("button", { name: "Importar documento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Fonte indexada");
  await page.getByRole("link", { name: "policy.pdf", exact: true }).click();
  await expect(
    page.getByText("Trecho 1 · página 1", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Trecho 2 · página 2", { exact: false }),
  ).toBeVisible();
  await page.getByText("Atualizar esta fonte", { exact: true }).click();
  await page
    .getByLabel("Novo conteúdo", { exact: true })
    .fill("O prazo de reembolso atualizado é de quatorze dias.");
  await page.getByRole("button", { name: "Atualizar e reindexar" }).click();
  await expect(page.getByText("Versão 2", { exact: false })).toBeVisible();
  await expect(page.getByText("Versão 1", { exact: false })).toBeVisible();
  await page.goto(base + "/sources");
  await page.getByLabel("URL HTTPS", { exact: true }).fill("https://127.0.0.1");
  await page
    .getByRole("button", { name: "Importar página", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "rede não permitida",
  );
});

test("widget em outro site consulta somente fonte publicada e respeita revogação", async ({
  page,
  browser,
}) => {
  await page.goto("/signup");
  await page
    .getByLabel("E-mail profissional")
    .fill(`widget-${Date.now()}@example.test`);
  await page
    .getByLabel("Senha", { exact: true })
    .fill("SivirinIA-widget-password-2026");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.getByLabel("Nome da empresa").fill("Widget teste E2E");
  await page.getByRole("button", { name: "Criar espaço", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+$/);
  const base = new URL(page.url()).pathname;
  await page.goto(base + "/sources");
  for (const [title, text] of [
    ["FAQ pública", "O prazo de reembolso público é de sete dias."],
    ["Documento privado", "O código secreto interno é LARANJA-9472."],
  ]) {
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByLabel("Conteúdo", { exact: true }).fill(text);
    await page.getByRole("button", { name: "Indexar conteúdo" }).click();
    await expect(page.getByRole("status")).toContainText("Fonte indexada");
  }
  await page.goto(base + "/agents");
  await page.getByLabel("Nome", { exact: true }).fill("Assistente público E2E");
  await page.getByRole("button", { name: "Criar agente", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Agente criado");
  await page.getByText("Link público e widget", { exact: true }).click();
  const publication = page.locator("form").filter({
    has: page.getByRole("button", { name: "Ativar link e widget" }),
  });
  await publication.getByLabel("FAQ pública", { exact: true }).check();
  await publication
    .getByLabel("Digite PUBLICAR para confirmar")
    .fill("PUBLICAR");
  await publication
    .getByLabel("Tenho autorização para tornar esse conteúdo público.")
    .check();
  await publication
    .getByRole("button", { name: "Ativar link e widget" })
    .click();
  const link = page.getByRole("textbox", { name: "Link compartilhável" });
  await expect(link).toBeVisible();
  const share = await link.inputValue();
  const token = new URL(share).pathname.split("/").pop()!;
  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  const customer = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(
      `<!doctype html><html><body><h1>Site do cliente de teste</h1><script src="http://127.0.0.1:3000/widget.js" data-agent="${token}" defer></script></body></html>`,
    );
  });
  await new Promise<void>((resolve) =>
    customer.listen(0, "127.0.0.1", resolve),
  );
  customer.unref();
  const address = customer.address();
  if (!address || typeof address === "string")
    throw new Error("Servidor do site de teste não iniciou.");
  await visitor.goto(`http://127.0.0.1:${address.port}/`);
  await visitor
    .getByRole("button", { name: "Conversar com SivirinIA" })
    .click();
  const frame = visitor.frameLocator(
    'iframe[title="Assistente de conhecimento SivirinIA"]',
  );
  await expect(
    frame.getByRole("heading", { name: "Assistente público E2E" }),
  ).toBeVisible();
  await frame.getByLabel("Sua pergunta").fill("Qual o prazo de reembolso?");
  await frame.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(frame.locator("article.answer")).toContainText("sete dias");
  await expect(frame.locator("article.answer")).not.toContainText(
    "LARANJA-9472",
  );
  await frame.getByLabel("Sua pergunta").fill("Qual o código secreto interno?");
  await frame.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(frame.locator("article.answer")).toContainText(
    "Não encontrei uma resposta confiável",
  );
  await page.getByRole("button", { name: "Revogar publicação" }).click();
  await expect(
    page.getByText("Publicação revogada.", { exact: false }),
  ).toBeVisible();
  const response = await visitor.goto(share);
  expect(response?.status()).toBe(404);
  await visitorContext.close();
  customer.closeAllConnections();
  await new Promise<void>((resolve) => customer.close(() => resolve()));
});

test("recuperação de senha por e-mail local e encerramento de sessão", async ({
  page,
  request,
}) => {
  const email = `recovery-${Date.now()}@example.test`;
  const oldPassword = "SivirinIA-old-password-2026";
  const newPassword = "SivirinIA-new-password-2026";
  await page.goto("/signup");
  await page.getByLabel("E-mail profissional").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(oldPassword);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(
    page.getByRole("heading", { name: "Recuperar acesso" }),
  ).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText(
    "enviaremos as instruções",
  );
  let messageId: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(
          "http://127.0.0.1:54324/api/v1/messages",
        );
        const box: { messages: { ID: string; To: { Address: string }[] }[] } =
          await response.json();
        messageId = box.messages.find((m) =>
          m.To.some((to) => to.Address === email),
        )?.ID;
        return Boolean(messageId);
      },
      { timeout: 15000 },
    )
    .toBe(true);
  const response = await request.get(
    `http://127.0.0.1:54324/api/v1/message/${messageId}`,
  );
  const message: { HTML: string } = await response.json();
  const link = message.HTML.match(
    /href="([^"]*\/auth\/v1\/verify[^"]*)"/,
  )?.[1]?.replace(/&amp;/g, "&");
  expect(Boolean(link), "O e-mail deve conter link de recuperação").toBe(true);
  await page.goto(link!);
  await expect(
    page.getByRole("heading", { name: "Defina sua nova senha" }),
  ).toBeVisible();
  await page.getByLabel("Nova senha").fill(newPassword);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(oldPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "E-mail ou senha incorretos",
  );
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace$/);
});
