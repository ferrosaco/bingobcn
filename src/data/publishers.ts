/** Nombres exactos. Un texto guardado solo se considera esta editorial si coincide letra por letra. */
export const PUBLISHERS = [
  "Arechi Manga",
  "Devir Manga",
  "Distrito Manga",
  "Ediciones Babylon",
  "Fandogamia",
  "Ivrea",
  "Kibook Ediciones",
  "Mangaline Ediciones",
  "Milky Way Ediciones",
  "Moztros",
  "Norma Editorial",
  "Panini Manga",
  "Pika Ediciones",
  "Planeta Cómic",
  "Satori Ediciones",
  "Sekai Editorial",
] as const;

export type Publisher = (typeof PUBLISHERS)[number];

export const OTHER_EDITORIAL = "__otra__";

export function isPublisher(value: string): value is Publisher {
  return (PUBLISHERS as readonly string[]).includes(value);
}

export function publisherLogo(value: string): string | null {
  if (!isPublisher(value)) return null;
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/publishers/${slug}.png`;
}
