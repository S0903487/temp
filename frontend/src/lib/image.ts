/**
 * Client-side image resizing.
 *
 * We resize *in the browser* (via <canvas>) rather than sending the
 * original file to the Worker to resize server-side, because Workers
 * can't decode arbitrary image formats without enabling Cloudflare's
 * Image Resizing product. Resizing here also means we only ever end up
 * with a small ~10-40KB WebP instead of a multi-megabyte original — that
 * matters because the result gets embedded directly as a base64 data URL
 * on the influencer record (see lib/uploads.ts), and a multi-MB original
 * embedded the same way is exactly what made influencer list/search
 * pages slow before this pipeline existed.
 */

const OUTPUT_SIZE = 256;
const OUTPUT_QUALITY = 0.85;

/**
 * Loads an image (a locally-picked File, or a Blob fetched from a remote
 * URL — see lib/uploads.ts's fetchRemoteImage), center-crops it to a
 * square, downsizes it to `size`x`size`, and re-encodes it as WebP.
 */
export async function resizeImageToWebp(source: Blob, size: number = OUTPUT_SIZE): Promise<Blob> {
  const bitmap = await loadBitmap(source);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser');

    // Center-crop the source image to a square before scaling, so
    // non-square photos don't come out stretched.
    const sourceSize = Math.min(bitmap.width, bitmap.height);
    const sourceX = (bitmap.width - sourceSize) / 2;
    const sourceY = (bitmap.height - sourceSize) / 2;

    ctx.drawImage(bitmap, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', OUTPUT_QUALITY));
    if (!blob) throw new Error('Could not encode image as WebP');
    return blob;
  } finally {
    bitmap.close();
  }
}

/** Converts a Blob to a `data:image/webp;base64,...` string for storing directly on a record. */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the resized image'));
    reader.readAsDataURL(blob);
  });
}

async function loadBitmap(source: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source);
  } catch {
    throw new Error('That file could not be read as an image');
  }
}
