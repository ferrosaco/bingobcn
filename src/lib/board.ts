export const CELL_COUNT = 25;

/** Centro de cada lado: arriba, izquierda, derecha, abajo. */
export const RED_CELLS = new Set([2, 10, 14, 22]);

/** Corazones (milagritos) en las cuatro esquinas. */
export const HEART_CELLS = new Set([0, 4, 20, 24]);

/** Estrella (licencia estrella), centro del cartón. */
export const STAR_CELL = 12;

export function cellDescription(index: number): string {
  const row = Math.floor(index / 5) + 1;
  const column = (index % 5) + 1;
  const marks = [`Fila ${row}, columna ${column}`];
  if (RED_CELLS.has(index)) marks.push("casilla roja");
  if (HEART_CELLS.has(index)) marks.push("milagrito");
  if (index === STAR_CELL) marks.push("licencia estrella");
  return marks.join(", ");
}
