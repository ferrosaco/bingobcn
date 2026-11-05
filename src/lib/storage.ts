const DB_NAME = "bingobcn";
const STORE = "board";
const KEY = "current";

export type BoardRecord = {
  images: (Blob | null)[];
  score: string;
  titles?: string[];
  editorials?: string[];
};

export type LoadedBoard = {
  record: BoardRecord | null;
  /** La foto estaba guardada, pero los bytes no se han podido leer. No hay que pisarla. */
  unreadable: boolean[];
};

type StoredImage = Blob | { bytes: ArrayBuffer; type: string } | null;

type RawRecord = {
  images?: StoredImage[];
  score?: string;
  titles?: string[];
  editorials?: string[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function sniffType(bytes: Uint8Array, fallback = ""): string {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (fallback.startsWith("image/")) return fallback;
  return "image/jpeg";
}

function isImage(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return true;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return true;
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function blobFromBytes(bytes: Uint8Array, fallbackType: string): { blob: Blob | null; unreadable: boolean } {
  if (!isImage(bytes)) return { blob: null, unreadable: true };
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return { blob: new Blob([copy], { type: sniffType(bytes, fallbackType) }), unreadable: false };
}

/**
 * Hay que pedir los bytes dentro del `onsuccess`, antes de cerrar la base.
 * Si no, Safari devuelve un blob vacío y la foto se ve como un icono roto;
 * el autoguardado siguiente grabaría ese vacío encima de la foto buena.
 */
function readImage(image: StoredImage): Promise<{ blob: Blob | null; unreadable: boolean }> {
  if (!image) return Promise.resolve({ blob: null, unreadable: false });
  if (image instanceof Blob) {
    return image.arrayBuffer().then((buffer) => blobFromBytes(new Uint8Array(buffer), image.type));
  }
  if (typeof image === "object" && image.bytes instanceof ArrayBuffer) {
    return Promise.resolve(blobFromBytes(new Uint8Array(image.bytes), image.type));
  }
  return Promise.resolve({ blob: null, unreadable: true });
}

export async function loadBoard(): Promise<LoadedBoard> {
  const db = await openDb();
  try {
    const loaded = await new Promise<LoadedBoard>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const record = request.result as RawRecord | undefined;
        if (!record) {
          resolve({ record: null, unreadable: [] });
          return;
        }
        const source = record.images ?? [];
        Promise.all(source.map((image) => readImage(image)))
          .then((results) => {
            resolve({
              record: {
                images: results.map((result) => result.blob),
                score: record.score ?? "",
                titles: record.titles,
                editorials: record.editorials,
              },
              unreadable: results.map((result) => result.unreadable),
            });
          })
          .catch(reject);
      };
    });
    return loaded;
  } finally {
    db.close();
  }
}

export async function saveBoard(record: BoardRecord, preserve: boolean[] = []): Promise<void> {
  const prepared = await Promise.all(
    record.images.map(async (blob, index) => {
      if (preserve[index]) return { keep: true as const, value: null };
      if (!blob || blob.size === 0) return { keep: false as const, value: null };
      const bytes = await blob.arrayBuffer();
      const view = new Uint8Array(bytes);
      if (!isImage(view)) return { keep: true as const, value: null };
      return {
        keep: false as const,
        value: { bytes, type: sniffType(view, blob.type) } as StoredImage,
      };
    }),
  );

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getRequest = store.get(KEY);
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existing = ((getRequest.result as RawRecord | undefined)?.images ?? []) as StoredImage[];
        const images = prepared.map((item, index) => (item.keep ? (existing[index] ?? null) : item.value));
        store.put(
          {
            images,
            score: record.score,
            titles: record.titles,
            editorials: record.editorials,
          },
          KEY,
        );
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("No se ha podido guardar."));
    });
  } finally {
    db.close();
  }
}
