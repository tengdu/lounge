/**
 * The public origin the site is served from, for absolute URLs in metadata
 * (Open Graph, canonical links, sitemap).
 *
 * Set per environment rather than hard-coded, so moving from the free
 * `*.pages.dev` address to a custom domain is a variable change in GitHub,
 * not a code change. Inlined at build time like every NEXT_PUBLIC_ value.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
