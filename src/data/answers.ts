/**
 * Licencias ya anunciadas. El título tiene que coincidir con el texto de la casilla,
 * sin importar mayúsculas ni espacios al principio o al final. La editorial, si se
 * indica, igual: mismas letras, sin distinguir mayúsculas.
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
