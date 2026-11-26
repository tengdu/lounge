"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, Shield, ShieldCheck } from "lucide-react";
import { signInWithGoogle, signOut, useAuth } from "@/lib/auth";
import { communityEnabled } from "@/lib/supabase";
import Avatar from "@/components/Avatar";

/** Sign-in for reviews and photos; hidden entirely when Supabase is not configured. */
export default function AccountButton() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!communityEnabled) return null;

  if (auth.status === "loading") {
    return <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-surface-sunken" />;
  }

  if (auth.status === "signed-out") {
    return (
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <LogIn size={15} aria-hidden="true" />
        Sign in
      </button>
    );
  }

  const { viewer } = auth;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${viewer.name}`}
        className="flex rounded-full ring-1 ring-hairline transition-opacity hover:opacity-85"
      >
        <Avatar name={viewer.name} src={viewer.avatarUrl} size={30} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-56 overflow-hidden rounded-[14px] bg-surface py-1.5 text-[14px] shadow-[0_12px_32px_rgb(0_0_0_/_0.14)] ring-1 ring-hairline"
        >
          <p className="truncate px-4 pt-1.5 pb-2 text-[13px] text-ink-tertiary">
            Signed in as <span className="font-medium text-ink">{viewer.name}</span>
          </p>
          {viewer.isAdmin && (
            <Link
              role="menuitem"
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-ink transition-colors hover:bg-surface-sunken"
            >
              <ShieldCheck size={15} aria-hidden="true" />
              Photo queue
            </Link>
          )}
          <Link
            role="menuitem"
            href="/privacy"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-ink transition-colors hover:bg-surface-sunken"
          >
            <Shield size={15} aria-hidden="true" />
            Privacy policy
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-ink transition-colors hover:bg-surface-sunken"
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
