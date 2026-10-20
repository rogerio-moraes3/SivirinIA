export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^(?:[\t\r\n]|\s*[=+@-])/.test(text) ? "'" : "") +
    text.replace(/"/g, '""') +
    '"'
  );
}
