"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface Viewer {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; viewer: Viewer };

const LOADING: AuthState = { status: "loading" };
const SIGNED_OUT: AuthState = { status: "signed-out" };

let state: AuthState = LOADING;
let started = false;
/** Auth events can arrive in quick succession; only the latest may land. */
let generation = 0;
const listeners = new Set<() => void>();

function set(next: AuthState) {
  state = next;
  for (const listener of listeners) listener();
}

async function resolve(session: Session | null) {
  const mine = ++generation;
  const client = supabase();
  if (!client || !session) {
    set(SIGNED_OUT);
    return;
  }

  const { user } = session;
  const meta = user.user_metadata ?? {};
  // The profile row holds the public name and the admin flag. Fall back to
  // Google's metadata for the moment between sign-up and the trigger landing.
  const { data } = await client
    .from("profiles")
    .select("display_name, avatar_url, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (mine !== generation) return;

  set({
    status: "signed-in",
    viewer: {
      id: user.id,
      name: data?.display_name ?? meta.full_name ?? meta.name ?? "You",
      avatarUrl: data?.avatar_url ?? meta.avatar_url ?? null,
      isAdmin: data?.is_admin ?? false,
    },
  });
}

function start() {
  if (started) return;
  started = true;
  const client = supabase();
  if (!client) {
    set(SIGNED_OUT);
    return;
  }

  client.auth.onAuthStateChange((event, session) => {
    // Supabase warns against awaiting other client calls inside this
    // callback — it holds the auth lock — so defer the profile read.
    setTimeout(() => void resolve(session), 0);

    // Tidy the `?code=` the OAuth round trip left behind.
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("code")) {
        url.searchParams.delete("code");
        window.history.replaceState(window.history.state, "", url);
      }
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING
  );
}

export async function signInWithGoogle() {
  const client = supabase();
  if (!client) return;
  // Come back to exactly this page — a static export has no callback route.
  const redirectTo = window.location.href.split("#")[0];
  await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
}

export async function signOut() {
  await supabase()?.auth.signOut();
}
