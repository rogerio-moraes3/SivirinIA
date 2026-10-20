/* SivirinIA embed: no secrets, CSS isolated in Shadow DOM, content served in its own iframe. */
(() => {
  const script = document.currentScript;
  const token = script?.getAttribute("data-agent");
  if (!script?.src || !token || !/^[a-f0-9]{64}$/.test(token)) return;
  const origin = new URL(script.src).origin;
  const host = document.createElement("div");
  host.setAttribute("data-sivirinia-widget", "");
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent =
    ":host{all:initial}button{position:fixed;bottom:24px;right:24px;border:1px solid #84eff5;background:#102a3c;color:#84eff5;padding:15px 20px;border-radius:40px;font:600 14px Arial,sans-serif;box-shadow:0 8px 30px #0004;cursor:pointer;z-index:2147483000}button:focus-visible{outline:3px solid #42d8ed;outline-offset:3px}iframe{position:fixed;right:24px;bottom:86px;width:min(390px,calc(100vw - 32px));height:min(600px,calc(100dvh - 120px));border:1px solid #345369;border-radius:16px;background:#080d1a;box-shadow:0 10px 50px #0006;z-index:2147483000}iframe[hidden]{display:none}@media(max-width:480px){button{right:16px;bottom:16px}iframe{right:16px;bottom:78px}}";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Conversar com SivirinIA";
  button.setAttribute("aria-expanded", "false");
  const frame = document.createElement("iframe");
  frame.title = "Assistente de conhecimento SivirinIA";
  frame.id = "sivirinia-assistant";
  frame.hidden = true;
  frame.setAttribute("referrerpolicy", "no-referrer");
  button.setAttribute("aria-controls", frame.id);
  function close() {
    frame.hidden = true;
    button.textContent = "Conversar com SivirinIA";
    button.setAttribute("aria-expanded", "false");
    button.focus();
  }
  button.addEventListener("click", () => {
    if (!frame.src) frame.src = origin + "/s/" + token + "?embed=1";
    const opening = frame.hidden;
    frame.hidden = !opening;
    button.setAttribute("aria-expanded", String(opening));
    button.textContent = opening
      ? "Fechar assistente"
      : "Conversar com SivirinIA";
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  root.append(style, frame, button);
  document.body.append(host);
})();
