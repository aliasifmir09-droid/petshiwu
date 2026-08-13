/** Prefer the compressed webp. Never fall back to a multi-MB PNG while a webp exists. */
export function slideDisplaySrc(slide: { src: string; webp: string }): string {
  return slide.webp.endsWith('.webp') ? slide.webp : slide.src;
}
