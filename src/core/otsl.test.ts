import { describe, it, expect } from "vitest";
import { buildOTSLGrid, parseRawTokens } from "./otsl";
import type { OTSLCell, OTSLTokenType } from "./types";

function cell(token: OTSLTokenType, text?: string): OTSLCell {
  return {
    token: token as any,
    content: text ? [{ type: "content", text }] : [],
  };
}

function tok(token: OTSLTokenType, text?: string) {
  return {
    token,
    content: text ? [{ type: "content" as const, text }] : [],
  };
}

describe("buildOTSLGrid", () => {
  it("handles empty input", () => {
    expect(buildOTSLGrid([])).toEqual({ rows: [] });
  });

  it("builds a 1x1 grid from single fcel", () => {
    const grid = buildOTSLGrid([cell("fcel", "A")]);
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0]).toHaveLength(1);
    expect(grid.rows[0][0].isHeader).toBe(false);
    expect(grid.rows[0][0].colspan).toBe(1);
    expect(grid.rows[0][0].rowspan).toBe(1);
  });

  it("builds a 2x2 grid", () => {
    const grid = parseRawTokens([
      tok("fcel", "A"), tok("fcel", "B"), tok("nl"),
      tok("fcel", "C"), tok("fcel", "D"), tok("nl"),
    ]);
    expect(grid.rows).toHaveLength(2);
    expect(grid.rows[0]).toHaveLength(2);
    expect(grid.rows[1]).toHaveLength(2);
  });

  it("identifies ched as header", () => {
    const grid = buildOTSLGrid([cell("ched", "H1"), cell("ched", "H2")]);
    expect(grid.rows[0][0].isHeader).toBe(true);
    expect(grid.rows[0][1].isHeader).toBe(true);
  });

  it("identifies rhed as header", () => {
    const grid = buildOTSLGrid([cell("rhed", "R1"), cell("fcel", "V1")]);
    expect(grid.rows[0][0].isHeader).toBe(true);
    expect(grid.rows[0][1].isHeader).toBe(false);
  });

  it("identifies corn as header", () => {
    const grid = buildOTSLGrid([cell("corn", "")]);
    expect(grid.rows[0][0].isHeader).toBe(true);
  });

  it("handles ecel (empty cells)", () => {
    const grid = buildOTSLGrid([cell("ecel"), cell("fcel", "X")]);
    expect(grid.rows[0]).toHaveLength(2);
    expect(grid.rows[0][0].isHeader).toBe(false);
  });

  it("computes colspan from lcel", () => {
    const grid = buildOTSLGrid([cell("fcel", "Wide"), cell("lcel")]);
    expect(grid.rows[0]).toHaveLength(1);
    expect(grid.rows[0][0].colspan).toBe(2);
  });

  it("computes rowspan from ucel", () => {
    const grid = parseRawTokens([
      tok("fcel", "Top"), tok("fcel", "B"), tok("nl"),
      tok("ucel"), tok("fcel", "D"), tok("nl"),
    ]);
    expect(grid.rows[0][0].rowspan).toBe(2);
    expect(grid.rows[1]).toHaveLength(1);
  });

  it("computes rowspan from srow", () => {
    const grid = parseRawTokens([
      tok("fcel", "Top"), tok("fcel", "B"), tok("nl"),
      tok("srow"), tok("fcel", "D"), tok("nl"),
    ]);
    expect(grid.rows[0][0].rowspan).toBe(2);
  });

  it("handles xcel (cross merge)", () => {
    const grid = parseRawTokens([
      tok("fcel", "Big"), tok("lcel"), tok("nl"),
      tok("ucel"), tok("xcel"), tok("nl"),
    ]);
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0][0].colspan).toBe(2);
    expect(grid.rows[0][0].rowspan).toBe(2);
  });
});

describe("parseRawTokens", () => {
  it("splits rows on nl tokens", () => {
    const grid = parseRawTokens([
      tok("ched", "H1"), tok("ched", "H2"), tok("nl"),
      tok("fcel", "A"), tok("fcel", "B"), tok("nl"),
    ]);
    expect(grid.rows).toHaveLength(2);
  });

  it("handles real DocLang table pattern", () => {
    const grid = parseRawTokens([
      tok("corn", ""), tok("ched", "Col1"), tok("ched", "Col2"), tok("nl"),
      tok("rhed", "Row1"), tok("fcel", "V1"), tok("fcel", "V2"), tok("nl"),
      tok("rhed", "Row2"), tok("fcel", "V3"), tok("fcel", "V4"), tok("nl"),
    ]);
    expect(grid.rows).toHaveLength(3);
    expect(grid.rows[0][0].isHeader).toBe(true);
    expect(grid.rows[1][0].isHeader).toBe(true);
    expect(grid.rows[1][1].isHeader).toBe(false);
  });

  it("handles empty sequence", () => {
    expect(parseRawTokens([])).toEqual({ rows: [] });
  });
});
