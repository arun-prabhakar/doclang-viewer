import type {
  OTSLCell,
  OTSLTokenType,
  ResolvedTableCell,
  ResolvedTableRow,
  TableGrid,
  InlineContent,
  SemanticElement,
  ElementHead,
} from "./types";

type OwnerKey = `${number},${number}`;

interface GridEntry {
  token: Exclude<OTSLTokenType, "nl">;
  ownerRow: number;
  ownerCol: number;
  content: (InlineContent | SemanticElement)[];
  head?: ElementHead;
}

interface InternalCell {
  token: OTSLTokenType;
  content?: (InlineContent | SemanticElement)[];
  head?: ElementHead;
}

function ownerKey(r: number, c: number): OwnerKey {
  return `${r},${c}`;
}

export function buildOTSLGrid(cells: OTSLCell[], rowCount?: number): TableGrid {
  const internal: InternalCell[] = cells.map((c) => ({
    token: c.token,
    content: c.content,
    head: c.head,
  }));
  return buildGrid(internal, rowCount);
}

function buildGrid(cells: InternalCell[], rowCount?: number): TableGrid {
  if (cells.length === 0) {
    return { rows: [] };
  }

  const grid: (GridEntry | null)[][] = [];
  const ownerMap = new Map<OwnerKey, { row: number; col: number }[]>();

  let row: (GridEntry | null)[] = [];

  for (const cell of cells) {
    if (cell.token === "nl") {
      grid.push(row);
      row = [];
      continue;
    }

    row.push({
      token: cell.token,
      ownerRow: -1,
      ownerCol: -1,
      content: cell.content ?? [],
      head: cell.head,
    });
  }

  if (row.length > 0) {
    grid.push(row);
  }

  if (rowCount !== undefined && grid.length < rowCount) {
    for (let i = grid.length; i < rowCount; i++) {
      grid.push([]);
    }
  }

  if (grid.length === 0) {
    return { rows: [] };
  }

  const maxCols = Math.max(...grid.map((r) => r.length));
  if (maxCols === 0) {
    return { rows: [] };
  }

  for (let r = 0; r < grid.length; r++) {
    while (grid[r].length < maxCols) {
      grid[r].push(null);
    }
  }

  const owners: (OwnerKey | null)[][] = grid.map((r) => r.map(() => null));

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < maxCols; c++) {
      const entry = grid[r][c];
      if (!entry) continue;

      switch (entry.token) {
        case "fcel":
        case "ecel":
        case "ched":
        case "rhed":
        case "corn": {
          owners[r][c] = ownerKey(r, c);
          entry.ownerRow = r;
          entry.ownerCol = c;
          const key = ownerKey(r, c);
          if (!ownerMap.has(key)) ownerMap.set(key, []);
          ownerMap.get(key)!.push({ row: r, col: c });
          break;
        }
        case "lcel": {
          const owner = findOwnerLeft(owners, r, c);
          if (owner) {
            owners[r][c] = owner;
            entry.ownerRow = parseInt(owner.split(",")[0], 10);
            entry.ownerCol = parseInt(owner.split(",")[1], 10);
            if (!ownerMap.has(owner)) ownerMap.set(owner, []);
            ownerMap.get(owner)!.push({ row: r, col: c });
          }
          break;
        }
        case "srow":
        case "ucel":
        case "xcel": {
          const owner = findOwnerAbove(owners, r, c);
          if (owner) {
            owners[r][c] = owner;
            entry.ownerRow = parseInt(owner.split(",")[0], 10);
            entry.ownerCol = parseInt(owner.split(",")[1], 10);
            if (!ownerMap.has(owner)) ownerMap.set(owner, []);
            ownerMap.get(owner)!.push({ row: r, col: c });
          }
          break;
        }
      }
    }
  }

  const resolved: ResolvedTableRow[] = [];
  const processedOwners = new Set<OwnerKey>();

  for (let r = 0; r < grid.length; r++) {
    const resolvedRow: ResolvedTableCell[] = [];

    for (let c = 0; c < maxCols; c++) {
      const entry = grid[r][c];
      if (!entry) continue;

      const oKey = owners[r][c];
      if (!oKey) continue;

      if (processedOwners.has(oKey)) continue;
      processedOwners.add(oKey);

      const positions = ownerMap.get(oKey) ?? [{ row: r, col: c }];

      let maxCol = c;
      let maxRow = r;

      for (const pos of positions) {
        if (pos.col > maxCol) maxCol = pos.col;
        if (pos.row > maxRow) maxRow = pos.row;
      }

      const colspan = maxCol - entry.ownerCol + 1;
      const rowspan = maxRow - entry.ownerRow + 1;

      const ownerEntry = grid[entry.ownerRow]?.[entry.ownerCol];

      const isHeader =
        entry.token === "ched" ||
        entry.token === "rhed" ||
        entry.token === "corn";

      resolvedRow.push({
        isHeader,
        rowspan,
        colspan,
        head: ownerEntry?.head ?? entry.head,
        content: ownerEntry?.content ?? entry.content,
      });
    }

    if (resolvedRow.length > 0) {
      resolved.push(resolvedRow);
    }
  }

  return { rows: resolved };
}

function findOwnerLeft(owners: (OwnerKey | null)[][], r: number, c: number): OwnerKey | null {
  for (let col = c - 1; col >= 0; col--) {
    const owner = owners[r][col];
    if (owner) return owner;
  }
  return null;
}

function findOwnerAbove(owners: (OwnerKey | null)[][], r: number, c: number): OwnerKey | null {
  if (r === 0) return null;
  return owners[r - 1][c];
}

export function parseRawTokens(
  tokenSequence: { token: OTSLTokenType; content: (InlineContent | SemanticElement)[] }[],
): TableGrid {
  const cells: InternalCell[] = tokenSequence.map((entry) => ({
    token: entry.token,
    content: entry.content,
  }));
  return buildGrid(cells);
}
