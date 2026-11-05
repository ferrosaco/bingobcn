const ALLOWED_HOST = "s4.anilist.co";
const ALLOWED_PATH = "/file/anilistcdn/media/";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return new Response("Falta la portada.", { status: 400 });

  let cover: URL;
  try {
    cover = new URL(raw);
  } catch {
    return new Response("Portada no válida.", { status: 400 });
  }

  if (
    cover.protocol !== "https:" ||
    cover.hostname !== ALLOWED_HOST ||
    !cover.pathname.startsWith(ALLOWED_PATH)
  ) {
    return new Response("Portada no válida.", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(cover, { cache: "force-cache" });
  } catch {
    return new Response("No se ha podido descargar la portada.", { status: 502 });
  }
  if (!upstream.ok) {
    return new Response("No se ha podido descargar la portada.", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
