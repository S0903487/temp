/**
 * Client-side image resizing.
 *
 * We resize *in the browser* (rather than sending the original file to the
 * Worker and resizing server-side) because Workers can't decode arbitrary
 * image formats without Cloudflare's paid Image Resizing product — but
 * every browser can do it for free via <canvas>. This also means we only
 * ever upload a small ~10-40KB WebP file instead of a multi-megabyte
 * original, which is what was making influencer list/search pages slow
 * (every row's raw base64 photo was being sent and stored in D1).
 */

const OUTPUT_SIZE = 256;
const OUTPUT_QUALITY = 0.85;

/**
 * Loads an image file, center-crops it to a square, downsizes it to
 * `size`x`size`, and re-encodes it as WebP.
 */
export async function resizeImageToWebp(file: File, size: number = OUTPUT_SIZE): Promise<Blob> {
  const bitmap = await loadBitmap(file);
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

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error('That file could not be read as an image');
  }
}
