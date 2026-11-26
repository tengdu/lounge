import { imagePlaceholders } from "@/data/image-placeholders";

/**
 * Lounges store the hero image path (`/images/lounges/foo.webp`).
 * scripts/optimize-images.mjs emits a matching `-card.webp` at grid size —
 * roughly a third the bytes — which is what the card grid should request.
 */
export function cardSrc(imageUrl: string): string {
  return imageUrl.replace(/\.webp$/, "-card.webp");
}

export function heroSrc(imageUrl: string): string {
  return imageUrl;
}

/** Inline LQIP for `placeholder="blur"`, or undefined if we have none. */
export function blurFor(imageUrl: string): string | undefined {
  return imagePlaceholders[imageUrl];
}

/**
 * Must match `basePath` in next.config.ts — client code cannot read it from
 * there. Empty since the site moved to its own origin on Cloudflare Pages;
 * kept so every asset path still goes through one place if that changes.
 */
export const BASE_PATH = "";

/**
 * next/image does not prefix a raw string src with the base path, so every
 * image path has to carry it explicitly.
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
