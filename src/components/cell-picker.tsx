"use client";

import { useEffect, useRef, useState } from "react";

import { anilistIdFromText, mangaById, searchManga, type AnilistWork } from "@/lib/anilist";

const FORMAT_LABEL: Record<string, string> = {
  MANGA: "manga",
  NOVEL: "novela",
  ONE_SHOT: "one-shot",
};

function workDetail(work: AnilistWork): string {
  const format = work.format ? FORMAT_LABEL[work.format] ?? work.format.toLowerCase() : "";
  const romaji = work.romaji !== work.title ? work.romaji : "";
  return [romaji, format, work.year].filter(Boolean).join(" · ");
}

export function CellPicker({
  cellNumber,
  onClose,
  onPickFile,
  onPickWork,
}: {
  cellNumber: number;
  onClose: () => void;
  onPickFile: () => void;
  onPickWork: (work: AnilistWork) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnilistWork[]>([]);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  useEffect(() => {
    const text = query.trim();
    const id = anilistIdFromText(text);
    if (!id && text.length < 2) {
      setResults([]);
      setStatus("");
      return;
    }
    const current = ++requestId.current;
    const timeout = window.setTimeout(() => {
      setStatus(id ? "Mirando el enlace…" : "Buscando…");
      const pending = id ? mangaById(id).then((work) => (work ? [work] : [])) : searchManga(text);
      pending
        .then((works) => {
          if (current !== requestId.current) return;
          setResults(works);
          setStatus(
            works.length
              ? ""
              : id
                ? "Ese enlace de AniList no tiene portada."
                : "No sale nada. Prueba el título en romaji o en inglés.",
          );
        })
        .catch((error: unknown) => {
          if (current !== requestId.current) return;
          setResults([]);
          setStatus(error instanceof Error ? error.message : "No se ha podido buscar.");
        });
    }, id ? 200 : 400);
    return () => window.clearTimeout(timeout);
  }, [query]);

  async function choose(work: AnilistWork) {
    setBusyId(work.id);
    setStatus("Guardando la portada en este dispositivo…");
    try {
      await onPickWork(work);
      dialogRef.current?.close();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se ha podido usar esa portada.");
      setBusyId(null);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="picker"
      aria-labelledby="picker-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <form method="dialog" className="picker-head">
        <h2 id="picker-title">Casilla {cellNumber}</h2>
        <button type="submit" className="picker-close" aria-label="Cerrar">
          ×
        </button>
      </form>
      <label className="picker-label">
        Buscar en AniList
        <input
          autoFocus
          value={query}
          placeholder="Título o enlace de anilist.co"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {status ? <p className="picker-status">{status}</p> : null}
      {results.length ? (
        <ul className="picker-results">
          {results.map((work) => (
            <li key={work.id}>
              <button type="button" disabled={busyId !== null} onClick={() => void choose(work)}>
                {/* AniList covers are remote; next/image cannot use this host without config. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={work.coverUrl} alt="" />
                <span>
                  <strong>{work.title}</strong>
                  <small>{workDetail(work)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="picker-file"
        onClick={() => {
          onPickFile();
          dialogRef.current?.close();
        }}
      >
        Elegir foto de la galería
      </button>
    </dialog>
  );
}
