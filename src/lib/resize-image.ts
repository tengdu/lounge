/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * Two reasons. Free-tier storage is 1 GB and bandwidth 5 GB a month, so a
 * 6 MB phone photo has to become ~200 KB. And redrawing through a canvas
 * drops every EXIF tag — including the GPS fix most phones embed, which would
 * otherwise publish where the traveller lives as soon as they share a photo
 * taken at home.
 */

export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
  type: "image/webp" | "image/jpeg";
}

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<ResizedImage> {
  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  // Older Safari cannot encode WebP and silently hands back a PNG instead.
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") {
    return { blob: webp, width: canvas.width, height: canvas.height, type: "image/webp" };
  }
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("This browser could not encode the photo.");
  return { blob: jpeg, width: canvas.width, height: canvas.height, type: "image/jpeg" };
}

export async function resizeImage(
  file: Blob,
  maxEdge: number,
  quality = 0.82
): Promise<ResizedImage> {
  let bitmap: ImageBitmap;
  try {
    // Honour the camera's rotation tag before it is thrown away.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "That file could not be read as a photo. HEIC images only open in Safari — try a JPEG."
    );
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not process the photo.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return encode(canvas, quality);
}
