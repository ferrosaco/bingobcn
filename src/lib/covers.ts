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
