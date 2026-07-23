/** Compress an image file to a JPEG data URL for localStorage-friendly storage. */
export async function fileToProductImage(file: File, maxSize = 480, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Could not process image');
  }
  ctx.fillStyle = '#EEF2F4';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}

export function categoryPlaceholder(category: string): string {
  const map: Record<string, string> = {
    Tools: '/products/hammer.svg',
    Fasteners: '/products/screws.svg',
    Electrical: '/products/outlet.svg',
    Plumbing: '/products/valve.svg',
    Paint: '/products/paint.svg',
    Lumber: '/products/stud.svg',
  };
  return map[category] ?? '/products/hammer.svg';
}
