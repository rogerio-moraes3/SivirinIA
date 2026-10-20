import { expect, it } from "vitest";
import { csvCell } from "../lib/csv";
it("escapa aspas e impede fórmulas na exportação CSV", () => {
  expect(csvCell('a,"b"')).toBe('"a,""b"""');
  expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"');
  expect(csvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
});
