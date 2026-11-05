const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  format
  startDate { year }
  title { romaji english }
  coverImage { extraLarge }
`;

const SEARCH_QUERY = `
  query ($texto: String) {
    Page(perPage: 8) {
      media(search: $texto, type: MANGA, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
    }
  }
`;

const BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id) { ${MEDIA_FIELDS} }
  }
`;

type Media = {
  id: number;
  format: string | null;
  startDate: { year: number | null } | null;
  title: { romaji: string | null; english: string | null };
  coverImage: { extraLarge: string | null };
};

export type AnilistWork = {
  id: number;
  title: string;
  romaji: string;
  coverUrl: string;
  year: number | null;
  format: string | null;
};

function toWork(media: Media): AnilistWork | null {
  const coverUrl = media.coverImage.extraLarge;
  if (!coverUrl) return null;
  const romaji = media.title.romaji?.trim() || "Sin título";
  const english = media.title.english?.trim() || "";
  return {
    id: media.id,
    title: english || romaji,
    romaji,
    coverUrl,
    year: media.startDate?.year ?? null,
    format: media.format,
  };
}

async function ask<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new Error("No hay conexión con AniList.");
  }
  if (response.status === 429) {
    throw new Error("AniList pide un respiro. Espera un minuto y vuelve a probar.");
  }
  if (!response.ok) {
    throw new Error("AniList no responde ahora mismo.");
  }
  const payload = (await response.json()) as { data?: T; errors?: unknown[] };
  if (!payload.data) throw new Error("AniList no ha devuelto resultados.");
  return payload.data;
}

export function anilistIdFromText(text: string): number | null {
  const match = text.match(/anilist\.co\/(?:manga|anime)\/(\d+)/i);
  if (!match) return null;
  return Number(match[1]);
}

export async function searchManga(text: string): Promise<AnilistWork[]> {
  const data = await ask<{ Page: { media: Media[] } }>(SEARCH_QUERY, { texto: text });
  return data.Page.media.map(toWork).filter((work): work is AnilistWork => work !== null);
}

export async function mangaById(id: number): Promise<AnilistWork | null> {
  const data = await ask<{ Media: Media | null }>(BY_ID_QUERY, { id });
  return data.Media ? toWork(data.Media) : null;
}
