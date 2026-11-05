"use client";

import { Dices, Download, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  CELL_COUNT,
  HEART_CELLS,
  RED_CELLS,
  STAR_CELL,
  cellDescription,
} from "@/lib/board";
import { fileToCover } from "@/lib/covers";
import { loadBoard, saveBoard } from "@/lib/storage";

type Slot = { url: string; blob: Blob } | null;

function emptySlots(): Slot[] {
  return Array.from({ length: CELL_COUNT }, () => null);
}

function emptyTitles(): string[] {
  return Array.from({ length: CELL_COUNT }, () => "");
}

function XLogo() {
  return (
    <svg className="credit-logo credit-logo-x" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

function BlueskyLogo() {
  return (
    <svg className="credit-logo credit-logo-bsky" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"
      />
    </svg>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#ff8eae"
        stroke="#ffffff"
        strokeWidth="1.2"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#f7d5e2"
        stroke="#ffffff"
        strokeWidth="1.2"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

export function BingoApp() {
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const [titles, setTitles] = useState<string[]>(emptyTitles);
  const [score, setScore] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<number | null>(null);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    let cancelled = false;
    loadBoard()
      .then((record) => {
        if (cancelled) return;
        if (record) {
          const next = emptySlots();
          record.images.forEach((blob, index) => {
            if (blob && index < CELL_COUNT) {
              next[index] = { blob, url: URL.createObjectURL(blob) };
            }
          });
          setSlots(next);
          setScore(record.score ?? "");
          const storedTitles = emptyTitles();
          record.titles?.forEach((title, index) => {
            if (index < CELL_COUNT && typeof title === "string") storedTitles[index] = title;
          });
          setTitles(storedTitles);
        }
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setNotice("No se ha podido recuperar el cartón guardado en este dispositivo.");
      });

    return () => {
      cancelled = true;
      slotsRef.current.forEach((slot) => {
        if (slot) URL.revokeObjectURL(slot.url);
      });
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      saveBoard({
        images: slots.map((slot) => slot?.blob ?? null),
        score,
        titles,
      }).catch(() => {
        setNotice("No se ha podido guardar el cartón en este dispositivo.");
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [slots, score, titles, hydrated]);

  function replaceSlot(index: number, blob: Blob) {
    setSlots((current) => {
      const next = current.slice();
      const previous = next[index];
      if (previous) URL.revokeObjectURL(previous.url);
      next[index] = { blob, url: URL.createObjectURL(blob) };
      return next;
    });
    setNotice(null);
  }

  async function putFile(index: number, file: File) {
    try {
      const blob = await fileToCover(file);
      replaceSlot(index, blob);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se ha podido usar esa foto.");
    }
  }

  function openPicker(index: number) {
    targetRef.current = index;
    const input = fileRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  function clearCell(index: number) {
    setSlots((current) => {
      const next = current.slice();
      const previous = next[index];
      if (previous) URL.revokeObjectURL(previous.url);
      next[index] = null;
      return next;
    });
  }

  function shuffle() {
    const order = Array.from({ length: CELL_COUNT }, (_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const hold = order[index];
      order[index] = order[swap];
      order[swap] = hold;
    }
    setSlots((current) => order.map((index) => current[index]));
    setTitles((current) => order.map((index) => current[index] ?? ""));
  }

  function clearAll() {
    setSlots((current) => {
      current.forEach((slot) => {
        if (slot) URL.revokeObjectURL(slot.url);
      });
      return emptySlots();
    });
    setTitles(emptyTitles());
  }

  async function exportCard() {
    const includeTitles = titles.some((title) => title.trim() !== "");
    flushSync(() => setExporting(true));
    const node = includeTitles ? layoutRef.current : sheetRef.current;
    if (!node) {
      setExporting(false);
      return;
    }
    setNotice(null);
    try {
      await document.fonts.ready;
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      const { domToBlob } = await import("modern-screenshot");
      const blob = await domToBlob(node, {
        scale: 3,
        backgroundColor: includeTitles ? "#c2e3f2" : "#d4f2fb",
      });
      if (!blob) throw new Error("export vacía");
      const url = URL.createObjectURL(blob);
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = "bingo-barcelona.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setNotice("Imagen lista. En el móvil, mantén pulsada la vista previa para guardarla en Fotos.");
    } catch {
      setNotice("No se ha podido exportar el cartón. Prueba otra vez.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="bingo-page">
      <div className="bingo-column">
        <header className="intro">
          <h1>Bingo de licencias</h1>
          <p>Toca una casilla y elige una portada de tu galería.</p>
        </header>

        <div className="toolbar">
          <Button type="button" className="tool-btn tool-btn-primary" onClick={shuffle}>
            <Dices />
            Aleatorio
          </Button>
          <Button
            type="button"
            className="tool-btn tool-btn-primary"
            onClick={exportCard}
            disabled={exporting}
          >
            <Download />
            {exporting ? "Exportando…" : "Exportar imagen"}
          </Button>
          <Button type="button" variant="outline" className="tool-btn tool-btn-quiet" onClick={clearAll}>
            <Trash2 />
            Vaciar
          </Button>
        </div>

        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}

        <div
          ref={layoutRef}
          className={
            exporting && titles.some((title) => title.trim() !== "")
              ? "board-layout is-exporting has-titles"
              : "board-layout"
          }
        >
        <div className="sheet-shadow">
          <article
            ref={sheetRef}
            className={exporting ? "sheet is-exporting" : "sheet"}
            aria-label="Cartón de bingo Barcelona"
          >
            <header className="sheet-header">
              <p className="bingo-word">BINGO</p>
              <p className="bingo-city">BARCELONA</p>
            </header>

            <div className="grid5">
              {slots.map((slot, index) => {
                const red = RED_CELLS.has(index);
                const heart = HEART_CELLS.has(index);
                const star = index === STAR_CELL;
                const filled = Boolean(slot);
                return (
                  <div
                    key={index}
                    className={[
                      "cell",
                      red ? "cell-red" : "",
                      dragIndex === index ? "cell-drop" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragIndex(index);
                    }}
                    onDragLeave={() => setDragIndex((current) => (current === index ? null : current))}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragIndex(null);
                      const file = event.dataTransfer.files?.[0];
                      if (file) void putFile(index, file);
                    }}
                  >
                    {slot ? (
                      // Blob URLs are local to this device; next/image cannot optimize them.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={slot.url} alt="" draggable={false} />
                    ) : null}
                    <button
                      type="button"
                      className="cell-hit"
                      aria-label={
                        filled
                          ? `Cambiar portada. ${cellDescription(index)}`
                          : `Añadir portada. ${cellDescription(index)}`
                      }
                      onClick={() => openPicker(index)}
                    />
                    {heart ? <Heart className="mark" /> : null}
                    {star ? <Star className="mark" /> : null}
                    {!filled && !heart && !star ? (
                      <span className="add-hint" aria-hidden="true">
                        +
                      </span>
                    ) : null}
                    {filled ? (
                      <button
                        type="button"
                        className="cell-remove"
                        aria-label={`Quitar portada. ${cellDescription(index)}`}
                        onClick={() => clearCell(index)}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <footer className="legend">
              <div>
                <p className="legend-title">PUNTOS</p>
                <p>ROJA (x3 con ed.)</p>
                <p>LÍNEA (puntos x2)</p>
              </div>
              <div>
                <p className="legend-mark">
                  <Heart className="legend-icon" />
                  MILAGRITOS (2 puntos)
                </p>
                <p className="legend-mark">
                  <Star className="legend-icon star-icon" />
                  LIC. ESTRELLA (3 puntos)
                </p>
              </div>
              <p className="hash">#BINGObcn26</p>
              <label className="score-line">
                Puntuación:
                <input
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  inputMode="decimal"
                  maxLength={12}
                  aria-label="Puntuación"
                />
              </label>
            </footer>
          </article>
        </div>

        <section className="titles" aria-label="Títulos de las obras">
          <header className="export-brand">
            <p className="bingo-word">BINGO</p>
            <p className="export-city">BARCELONA</p>
          </header>
          <h2>Títulos</h2>
          <ol>
            {titles.map((title, index) => (
              <li
                key={index}
                className={index > 0 && index % 5 === 0 ? "title-row group-start" : "title-row"}
              >
                <span className="title-num">{index + 1}</span>
                <div className="title-field">
                  <input
                    className="title-input"
                    value={title}
                    maxLength={80}
                    autoComplete="off"
                    aria-label={`Título de la casilla ${index + 1}`}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTitles((current) => {
                        const next = current.slice();
                        next[index] = value;
                        return next;
                      });
                    }}
                  />
                  <span className="title-text">{title}</span>
                </div>
              </li>
            ))}
          </ol>
          <footer className="export-legend">
            <div className="export-legend-side">
              <p>PUNTOS</p>
              <p>ROJA (x3 con ed.)</p>
              <p>LÍNEA (puntos x2)</p>
              <p className="export-hash">#BINGObcn26</p>
            </div>
            <div className="export-legend-side">
              <p className="legend-mark">
                <Heart className="legend-icon" />
                MILAGRITOS (2 puntos)
              </p>
              <p className="legend-mark">
                <Star className="legend-icon star-icon" />
                LIC. ESTRELLA (3 puntos)
              </p>
              <p className="export-score">Puntuación:{score ? ` ${score}` : ""}</p>
            </div>
          </footer>
        </section>
        </div>

        <p className="fine-print">
          Las portadas y los títulos se quedan en este dispositivo. Nada se sube a un servidor.
        </p>

        {previewUrl ? (
          <section className="preview" aria-label="Imagen exportada">
            <h2>Cartón exportado</h2>
            <p>En el móvil, mantén pulsada la imagen para guardarla en la galería.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Cartón de bingo exportado" />
            <a href={previewUrl} download="bingo-barcelona.png">
              Descargar PNG
            </a>
          </section>
        ) : null}

        <div className="credits">
          <p className="credit">
            Hecho por{" "}
            <a href="https://x.com/jerdieh" target="_blank" rel="noreferrer">
              @jerdieh
              <XLogo />
            </a>
          </p>
          <p className="credit">
            Idea original de{" "}
            <a
              href="https://bsky.app/profile/ounomachi.eurosky.social"
              target="_blank"
              rel="noreferrer"
            >
              @ounomachi
              <BlueskyLogo />
            </a>
          </p>
        </div>
      </div>

      <input
        ref={fileRef}
        className="file-input"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const index = targetRef.current;
          if (file && index != null) void putFile(index, file);
        }}
      />
    </main>
  );
}
