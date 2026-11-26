"use client";

/**
 * Lets controls elsewhere on the page — the "Contribute a photo" link under
 * the hero, which renders on the server — open the review composer that lives
 * in the Reviews section, without threading state through a server component.
 */
export type ComposerMode = "review" | "photos";

const EVENT = "lounge:compose";

export function openComposer(mode: ComposerMode) {
  window.dispatchEvent(new CustomEvent<ComposerMode>(EVENT, { detail: mode }));
}

export function onOpenComposer(handler: (mode: ComposerMode) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<ComposerMode>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
