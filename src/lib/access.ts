import type { Access, AccessRoute, Credential } from "@/data/lounges";

/**
 * What a given traveller's credentials mean for a given lounge.
 *
 * - `in`     — they hold something that opens the door today.
 * - `buy`    — nothing they hold works, but the lounge sells entry.
 * - `ticket` — entry here turns on the cabin they are flying, which nobody
 *              can answer in advance, so we do not pretend to.
 * - `no`     — it needs a credential they have not got.
 */
export type AccessStatus = "in" | "buy" | "ticket" | "no";

export interface AccessVerdict {
  status: AccessStatus;
  /** The specific routes their credentials satisfy. Empty unless `in`. */
  matched: AccessRoute[];
}

export function verdictFor(access: Access, wallet: ReadonlySet<Credential>): AccessVerdict {
  const matched = access.routes.filter((r) => r.credential !== null && wallet.has(r.credential));
  if (matched.length > 0) return { status: "in", matched };
  if (access.dayPass) return { status: "buy", matched: [] };
  if (access.routes.some((r) => r.via === "cabin")) return { status: "ticket", matched: [] };
  return { status: "no", matched: [] };
}

export const STATUS_LABEL: Record<AccessStatus, string> = {
  in: "You can get in",
  buy: "Day pass available",
  ticket: "Depends on your ticket",
  no: "Not with what you hold",
};
