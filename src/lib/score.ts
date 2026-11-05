import { LICENSES, type LicenseAnswer } from "@/data/answers";
import { CELL_COUNT, HEART_CELLS, RED_CELLS, STAR_CELL } from "@/lib/board";

export type CellVerdict = {
  hit: boolean;
  editorialHit: boolean;
  points: number;
};

function lines(): number[][] {
  const rows = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, column) => row * 5 + column),
  );
  const columns = Array.from({ length: 5 }, (_, column) =>
    Array.from({ length: 5 }, (_, row) => row * 5 + column),
  );
  return [...rows, ...columns, [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]];
}

export function matchLicense(title: string): LicenseAnswer | undefined {
  const trimmed = title.trim();
  if (!trimmed) return undefined;
  return LICENSES.find((license) => license.title.trim() === trimmed);
}

function basePoints(index: number, editorialHit: boolean): number {
  if (index === STAR_CELL) return 3;
  if (editorialHit) return 3;
  if (HEART_CELLS.has(index)) return 1;
  return 1;
}

export function scoreBoard(titles: string[], editorials: string[]): {
  total: number;
  cells: CellVerdict[];
} {
  const cells: CellVerdict[] = Array.from({ length: CELL_COUNT }, (_, index) => {
    const license = matchLicense(titles[index] ?? "");
    const editorialHit = Boolean(
      license?.editorial &&
        RED_CELLS.has(index) &&
        (editorials[index] ?? "") === license.editorial,
    );
    const hit = Boolean(license);
    return {
      hit,
      editorialHit,
      points: hit ? basePoints(index, editorialHit) : 0,
    };
  });

  const multiplier = Array.from({ length: CELL_COUNT }, () => 1);
  for (const line of lines()) {
    if (!line.every((index) => cells[index].hit)) continue;
    for (const index of line) multiplier[index] *= 2;
  }

  const total = cells.reduce((sum, cell, index) => sum + cell.points * multiplier[index], 0);
  return { total, cells };
}
