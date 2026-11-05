const MAX_EDGE = 1200;

export async function fileToCover(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Elige una imagen.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No se ha podido leer la foto. Prueba con JPG o PNG.");
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se ha podido preparar la foto.");
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.86);
    });
    if (!blob) throw new Error("No se ha podido preparar la foto.");
    return blob;
  } finally {
    bitmap.close();
  }
}

/** Si el navegador perdió el tipo al guardar la foto, lo recupera sin cambiar los bytes. */
export async function blobAsImage(blob: Blob): Promise<Blob> {
  if (blob.type.startsWith("image/")) return blob;
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  let type = "image/jpeg";
  if (head[0] === 0x89 && head[1] === 0x50) type = "image/png";
  else if (head[0] === 0xff && head[1] === 0xd8) type = "image/jpeg";
  else if (head[0] === 0x47 && head[1] === 0x49) type = "image/gif";
  else if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46) {
    type = "image/webp";
  }
  return new Blob([await blob.arrayBuffer()], { type });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("No se ha podido leer la foto."));
    reader.readAsDataURL(blob);
  });
}
