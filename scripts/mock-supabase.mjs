#!/usr/bin/env node
/**
 * A throwaway, in-memory stand-in for Supabase, for trying the reviews and
 * photos UI locally before a real project exists.
 *
 *   node scripts/mock-supabase.mjs
 *   # then run the dev server with:
 *   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=mock npm run dev
 *
 * It fakes just enough of the auth, REST and storage APIs that the site uses.
 * "Sign in with Google" lands on a local page that signs you in as a demo
 * moderator. Nothing is checked like the real row-level security does, and
 * everything is lost when it stops. Never point a deployed build at it.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT ?? 54321);
const IMAGES = path.join(import.meta.dirname, "..", "public", "images", "lounges");
const BUCKET = "lounge-photos";

const DEMO = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@example.com",
  name: "Demo Traveller",
};

// ─── State ─────────────────────────────────────────────────────────────────

const profiles = new Map([
  [DEMO.id, { id: DEMO.id, display_name: "Demo T.", avatar_url: null, is_admin: true }],
  ["u-maya", { id: "u-maya", display_name: "Maya R.", avatar_url: null, is_admin: false }],
  ["u-sam", { id: "u-sam", display_name: "Sam K.", avatar_url: null, is_admin: false }],
]);
const reviews = [];
const photos = [];
/** storage path → { buf, type } */
const files = new Map();

const SEED_LOUNGE = "bwi-the-club-bwi-concourse-d-airside-upper-level";
function seed() {
  const day = 86_400_000;
  const at = (daysAgo) => new Date(Date.now() - daysAgo * day).toISOString();
  reviews.push(
    {
      id: crypto.randomUUID(), lounge_id: SEED_LOUNGE, user_id: "u-maya", rating: 4,
      body: "Quiet before 9am and the espresso is good. Showers were clean.",
      visited_on: at(20).slice(0, 10), created_at: at(18), updated_at: at(18),
    },
    {
      id: crypto.randomUUID(), lounge_id: SEED_LOUNGE, user_id: "u-sam", rating: 2,
      body: "Packed at 5pm — waited 20 minutes for a seat.",
      visited_on: null, created_at: at(40), updated_at: at(39),
    }
  );
  const add = (name, reviewId, daysAgo) => {
    const full = path.join(IMAGES, `${name}.webp`);
    const thumb = path.join(IMAGES, `${name}-card.webp`);
    if (!fs.existsSync(full)) return;
    files.set(`seed/${name}.webp`, { buf: fs.readFileSync(full), type: "image/webp" });
    files.set(`seed/${name}-thumb.webp`, {
      buf: fs.readFileSync(fs.existsSync(thumb) ? thumb : full), type: "image/webp",
    });
    photos.push({
      id: crypto.randomUUID(), lounge_id: SEED_LOUNGE, user_id: "u-maya", review_id: reviewId,
      storage_path: `seed/${name}.webp`, thumb_path: `seed/${name}-thumb.webp`,
      width: 1600, height: 1067, caption: null, status: "approved",
      created_at: at(daysAgo), moderated_at: at(daysAgo),
    });
  };
  add("bwi-the-club", reviews[0].id, 18);
}
seed();

// ─── Helpers ───────────────────────────────────────────────────────────────

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const user = {
    id: DEMO.id, aud: "authenticated", role: "authenticated", email: DEMO.email,
    user_metadata: { full_name: DEMO.name }, app_metadata: { provider: "google" },
    created_at: new Date().toISOString(),
  };
  return {
    access_token: `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: DEMO.id, exp, role: "authenticated", aud: "authenticated" })}.mock`,
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "mock-refresh", user,
  };
}

function caller(req) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  try {
    const sub = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString()).sub;
    return profiles.get(sub) ?? null;
  } catch {
    return null;
  }
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-expose-headers": "content-range",
};

function send(res, status, data, headers = {}) {
  res.writeHead(status, { ...CORS, "content-type": "application/json", ...headers });
  res.end(data === undefined ? "" : JSON.stringify(data));
}

/** PostgREST-ish filters: col=eq.x, col=neq.x */
function filter(rows, params) {
  let out = rows;
  for (const [key, value] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(key)) continue;
    const [op, ...rest] = value.split(".");
    const v = rest.join(".");
    if (op === "eq") out = out.filter((r) => String(r[key]) === v);
    if (op === "neq") out = out.filter((r) => String(r[key]) !== v);
  }
  const order = params.get("order");
  if (order) {
    const [col, dir] = order.split(".");
    out = [...out].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === "desc" ? -1 : 1));
  }
  return out;
}

function respondRows(req, res, all, params) {
  const offset = Number(params.get("offset") ?? 0);
  const limit = params.has("limit") ? Number(params.get("limit")) : all.length;
  const rows = all.slice(offset, offset + limit);
  const headers = {};
  if ((req.headers.prefer ?? "").includes("count=exact")) {
    headers["content-range"] = `${offset}-${offset + rows.length - 1}/${all.length}`;
  }
  if ((req.headers.accept ?? "").includes("vnd.pgrst.object")) {
    if (rows.length !== 1) return send(res, 406, { code: "PGRST116", message: `${rows.length} rows` });
    return send(res, 200, rows[0], headers);
  }
  send(res, 200, rows, headers);
}

const withAuthor = (r) => {
  const p = profiles.get(r.user_id);
  return { ...r, author: p ? { display_name: p.display_name, avatar_url: p.avatar_url } : null };
};

function ratings() {
  const by = new Map();
  for (const r of reviews) {
    const row = by.get(r.lounge_id) ?? { lounge_id: r.lounge_id, sum: 0, review_count: 0, stars_1: 0, stars_2: 0, stars_3: 0, stars_4: 0, stars_5: 0 };
    row.sum += r.rating;
    row.review_count += 1;
    row[`stars_${r.rating}`] += 1;
    by.set(r.lounge_id, row);
  }
  return [...by.values()].map(({ sum, ...row }) => ({ ...row, avg_rating: Math.round((sum / row.review_count) * 100) / 100 }));
}

/** Pulls the file out of the multipart body supabase-js sends for uploads. */
function fileFromMultipart(buf, contentType) {
  const boundary = /boundary=(.+)$/.exec(contentType ?? "")?.[1];
  if (!boundary) return { buf, type: contentType };
  const sep = Buffer.from(`--${boundary}`);
  let start = buf.indexOf(sep);
  while (start !== -1) {
    const next = buf.indexOf(sep, start + sep.length);
    if (next === -1) break;
    const part = buf.subarray(start + sep.length + 2, next - 2);
    const headerEnd = part.indexOf("\r\n\r\n");
    const head = part.subarray(0, headerEnd).toString();
    if (/content-type:\s*image\//i.test(head)) {
      return { buf: part.subarray(headerEnd + 4), type: /content-type:\s*(\S+)/i.exec(head)[1] };
    }
    start = next;
  }
  return { buf, type: "application/octet-stream" };
}

const SIGN_IN_PAGE = (redirect) => `<!doctype html><meta name=viewport content="width=device-width">
<title>Mock sign-in</title>
<body style="font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#f5f5f7">
<div style="background:#fff;padding:32px 36px;border-radius:18px;box-shadow:0 8px 30px #0001;max-width:360px;text-align:center">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#b45309">Local mock — not Google</p>
<h1 style="font-size:22px;margin:0 0 12px">Sign in</h1>
<p style="color:#6e6e73;margin:0 0 24px">This stands in for Google while there is no Supabase project. You'll be signed in as <b>${DEMO.name}</b>, a moderator.</p>
<a href="${redirect}" style="display:inline-block;background:#1d1d1f;color:#fff;padding:10px 20px;border-radius:12px;text-decoration:none">Continue as ${DEMO.name}</a>
</div>`;

// ─── Server ────────────────────────────────────────────────────────────────

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS);
      return res.end();
    }
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks);
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const p = url.pathname;
      const params = url.searchParams;
      const me = caller(req);
      const json = () => (raw.length ? JSON.parse(raw.toString()) : {});
      console.log(req.method, p + url.search);

      // ── Auth ──
      if (p === "/auth/v1/authorize") {
        const back = new URL(params.get("redirect_to") ?? "http://localhost:3000/lounge/");
        back.searchParams.set("code", "mock-code");
        res.writeHead(200, { "content-type": "text/html" });
        return res.end(SIGN_IN_PAGE(back.toString()));
      }
      if (p === "/auth/v1/token") return send(res, 200, session());
      if (p === "/auth/v1/user") return me ? send(res, 200, session().user) : send(res, 401, { message: "no session" });
      if (p === "/auth/v1/logout") return send(res, 204);
      if (p.startsWith("/auth/v1/")) return send(res, 200, {});

      // ── Storage ──
      if (p.startsWith(`/storage/v1/object/public/${BUCKET}/`)) {
        const file = files.get(decodeURIComponent(p.slice(`/storage/v1/object/public/${BUCKET}/`.length)));
        if (!file) return send(res, 404, { message: "not found" });
        res.writeHead(200, { ...CORS, "content-type": file.type, "cache-control": "no-store" });
        return res.end(file.buf);
      }
      if (p.startsWith(`/storage/v1/object/${BUCKET}/`) && req.method === "POST") {
        if (!me) return send(res, 403, { message: "sign in first" });
        const key = decodeURIComponent(p.slice(`/storage/v1/object/${BUCKET}/`.length));
        files.set(key, fileFromMultipart(raw, req.headers["content-type"]));
        return send(res, 200, { Key: `${BUCKET}/${key}` });
      }
      if (p === `/storage/v1/object/${BUCKET}` && req.method === "DELETE") {
        for (const key of json().prefixes ?? []) files.delete(key);
        return send(res, 200, []);
      }

      // ── REST ──
      if (p === "/rest/v1/profiles") return respondRows(req, res, filter([...profiles.values()], params), params);
      if (p === "/rest/v1/lounge_ratings") return respondRows(req, res, filter(ratings(), params), params);

      if (p === "/rest/v1/reviews") {
        if (req.method === "GET") return respondRows(req, res, filter(reviews, params).map(withAuthor), params);
        if (!me) return send(res, 401, { code: "42501", message: "row-level security" });
        if (req.method === "POST") {
          const b = json();
          if (reviews.some((r) => r.lounge_id === b.lounge_id && r.user_id === me.id)) {
            return send(res, 409, { code: "23505", message: "duplicate key" });
          }
          const now = new Date().toISOString();
          const row = { id: crypto.randomUUID(), user_id: me.id, body: "", visited_on: null, ...b, created_at: now, updated_at: now };
          reviews.push(row);
          return respondRows(req, res, [withAuthor(row)], new URLSearchParams());
        }
        const targets = filter(reviews, params);
        if (req.method === "PATCH") {
          const b = json();
          const mine = targets.filter((r) => r.user_id === me.id);
          for (const r of mine) Object.assign(r, b, { updated_at: new Date().toISOString() });
          return respondRows(req, res, mine.map(withAuthor), new URLSearchParams());
        }
        if (req.method === "DELETE") {
          for (const r of targets.filter((r) => r.user_id === me.id || me.is_admin)) reviews.splice(reviews.indexOf(r), 1);
          return send(res, 204);
        }
      }

      if (p === "/rest/v1/photos") {
        const visible = photos.filter((ph) => ph.status === "approved" || ph.user_id === me?.id || me?.is_admin);
        if (req.method === "GET") return respondRows(req, res, filter(visible, params), params);
        if (!me) return send(res, 401, { code: "42501", message: "row-level security" });
        if (req.method === "POST") {
          const row = { id: crypto.randomUUID(), user_id: me.id, review_id: null, caption: null, ...json(), status: "pending", created_at: new Date().toISOString(), moderated_at: null };
          photos.push(row);
          return respondRows(req, res, [row], new URLSearchParams());
        }
        const targets = filter(photos, params);
        if (req.method === "PATCH") {
          if (!me.is_admin) return send(res, 200, []);
          for (const ph of targets) Object.assign(ph, json());
          return send(res, 200, targets);
        }
        if (req.method === "DELETE") {
          for (const ph of targets.filter((ph) => ph.user_id === me.id || me.is_admin)) photos.splice(photos.indexOf(ph), 1);
          return send(res, 204);
        }
      }

      send(res, 404, { message: `mock has no route for ${req.method} ${p}` });
    });
  })
  .listen(PORT, () => {
    console.log(`Mock Supabase on http://localhost:${PORT} — in memory, resets on restart.`);
    console.log(`Seeded reviews on /lounge/lounge/${SEED_LOUNGE}`);
  });
