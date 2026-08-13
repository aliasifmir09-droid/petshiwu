function canvasToJpeg(source: CanvasImageSource, width: number, height: number, maxEdge: number, quality: number): Promise<File> {
  const scale = Math.max(width, height) > maxEdge ? maxEdge / Math.max(width, height) : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Could not process this photo.'));
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress this photo.'));
          return;
        }
        resolve(new File([blob], 'photo-search.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Shrink any phone photo to a JPEG Gemini can read.
 * Tries HTMLImageElement first, then createImageBitmap (helps iPhone HEIC on Safari).
 */
export function compressImageFile(file: File, maxEdge = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Image took too long to process. Please try a screenshot of the product instead.'));
    }, 20_000);

    const finish = (result: Promise<File>) => {
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      result.then(resolve, reject);
    };

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      finish(canvasToJpeg(img, img.width, img.height, maxEdge, quality));
    };
    img.onerror = async () => {
      try {
        if (typeof createImageBitmap !== 'function') {
          throw new Error('unsupported');
        }
        const bitmap = await createImageBitmap(file);
        finish(canvasToJpeg(bitmap, bitmap.width, bitmap.height, maxEdge, quality).finally(() => bitmap.close?.()));
      } catch {
        window.clearTimeout(timeoutId);
        URL.revokeObjectURL(url);
        reject(new Error('This photo format is not supported. Take a screenshot of the product and upload that.'));
      }
    };
    img.src = url;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function photoSearchErrorMessage(err: unknown): string {
  const anyErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const status = anyErr?.response?.status;
  const apiMessage = anyErr?.response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  if (status === 413) return 'Photo is still too large. Please take a screenshot of the product and try that.';
  if (status === 503) return 'Photo search is waking up. Wait a few seconds and try again.';
  if (status === 429) return 'Too many photo searches. Please wait a minute and try again.';
  if (anyErr?.message === 'Network Error') return 'Could not reach photo search. Check your connection and try again.';
  if (typeof anyErr?.message === 'string' && anyErr.message && !anyErr.message.startsWith('Request failed')) {
    return anyErr.message;
  }
  return 'Could not search with that photo. Please try a clearer picture of the product.';
}
