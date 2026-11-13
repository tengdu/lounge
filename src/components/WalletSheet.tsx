"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Wallet, X } from "lucide-react";
import { CREDENTIALS, CREDENTIAL_GROUPS, type AccessVia } from "@/data/lounges";
import { useWallet } from "@/lib/wallet";

/**
 * Groups a traveller can actually tick. `cabin` and `paid` are shown on each
 * lounge but never stored: one depends on today's boarding pass, the other on
 * whether you feel like paying.
 */
const PICKABLE: AccessVia[] = ["membership", "program", "card", "status", "military"];

const GROUP_HINT: Partial<Record<AccessVia, string>> = {
  status: "Only counts on the flights each programme specifies — usually international.",
  military: "Opens the USO and other military hospitality lounges.",
};

export default function WalletSheet({ compact = false }: { compact?: boolean }) {
  const { credentials, ready, has, toggle, clear } = useWallet();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // <dialog> only becomes modal — focus trap, Esc, inert background — when
  // opened imperatively, so the React state drives the DOM method.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onBackdropClick = useCallback((event: React.MouseEvent<HTMLDialogElement>) => {
    // A click that lands on the dialog element itself is a click on the
    // backdrop — the panel inside stops its own events from reaching here.
    if (event.target === dialogRef.current) setOpen(false);
  }, []);

  const count = credentials.size;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-4 text-[14px] font-medium text-ink-secondary ring-1 ring-hairline transition-colors hover:text-ink"
            : "inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-ink px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        }
      >
        <Wallet size={15} strokeWidth={1.8} aria-hidden="true" />
        {/* Before hydration the count is unknown; show the neutral label so the
            server and client markup agree. */}
        {ready && count > 0 ? `${count} in your wallet` : "What do you carry?"}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={onBackdropClick}
        aria-labelledby="wallet-title"
        className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[20px] bg-canvas p-0 text-ink shadow-[0_24px_64px_rgb(0_0_0_/_0.24)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[min(720px,85vh)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
            <div>
              <h2 id="wallet-title" className="text-title text-[20px] text-ink">
                What do you carry?
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
                Tick your cards, memberships and status. Every lounge will then say whether you
                can walk in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mr-1.5 -mt-1 shrink-0 rounded-full p-1.5 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {CREDENTIAL_GROUPS.filter((g) => PICKABLE.includes(g.id)).map((group) => {
              const items = CREDENTIALS.filter((c) => c.group === group.id);
              if (items.length === 0) return null;

              return (
                <fieldset key={group.id} className="mb-6 last:mb-0">
                  <legend className="mb-1 text-[12px] font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
                    {group.label}
                  </legend>
                  {GROUP_HINT[group.id] && (
                    <p className="mb-2.5 text-[12px] leading-relaxed text-ink-tertiary">
                      {GROUP_HINT[group.id]}
                    </p>
                  )}

                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {items.map((credential) => {
                      const checked = ready && has(credential.id);
                      return (
                        <li key={credential.id}>
                          <label
                            className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] leading-snug transition-colors ${
                              checked
                                ? "bg-accent/10 text-ink ring-1 ring-accent/30"
                                : "bg-surface text-ink-secondary ring-1 ring-hairline hover:text-ink"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(credential.id)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] transition-colors ${
                                checked ? "bg-accent text-white" : "ring-1 ring-hairline-strong"
                              }`}
                            >
                              {checked && <Check size={12} strokeWidth={3} />}
                            </span>
                            {credential.label}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              );
            })}
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-hairline px-6 py-4">
            <p className="text-[12px] leading-relaxed text-ink-tertiary">
              Saved in this browser only — never uploaded.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {ready && count > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-[10px] px-3 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[10px] bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          </footer>
        </div>
      </dialog>
    </>
  );
}
