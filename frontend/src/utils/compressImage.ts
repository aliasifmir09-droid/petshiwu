export function compressImageFile(file: File, maxEdge = 900, quality = 0.78): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const timeoutId = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Image took too long to process. Please try again.'));
    }, 30_000);

    const img = new Image();
    img.onload = () => {
      window.clearTimeout(timeoutId);
      const scale = Math.max(img.width, img.height) > maxEdge
        ? maxEdge / Math.max(img.width, img.height)
        : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not process this photo.'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Could not compress this photo.'));
            return;
          }
          resolve(new File([blob], 'neural-scan.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo.'));
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
