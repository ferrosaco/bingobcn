/**
 * Licencias ya anunciadas. El título tiene que coincidir con el texto de la casilla,
 * sin espacios al principio ni al final. La editorial, si se indica, tiene que coincidir
 * exactamente con una de la lista.
 *
 * Ejemplo:
 * { title: "Frieren: Beyond Journey's End", editorial: "Norma Editorial" }
 */
export type LicenseAnswer = {
  title: string;
  editorial?: string;
};

export const LICENSES: LicenseAnswer[] = [
  { title: "Sgt Frog", editorial: "Norma Editorial" },
  { title: "Blue Lock", editorial: "Planeta Cómic" },
];
