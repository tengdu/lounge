"use client";

import {
  Award,
  Banknote,
  BadgeCheck,
  Check,
  CreditCard,
  Plane,
  Shield,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { CREDENTIAL_GROUPS, type Access, type AccessVia } from "@/data/lounges";
import { STATUS_LABEL, verdictFor, type AccessStatus } from "@/lib/access";
import { useWallet } from "@/lib/wallet";
import WalletSheet from "./WalletSheet";

const VIA_ICONS: Record<AccessVia, LucideIcon> = {
  membership: BadgeCheck,
  program: Ticket,
  card: CreditCard,
  status: Award,
  cabin: Plane,
  military: Shield,
  paid: Banknote,
};

const GROUP_LABEL = new Map(CREDENTIAL_GROUPS.map((g) => [g.id, g.label]));

const VERDICT_STYLE: Record<AccessStatus, string> = {
  in: "bg-emerald-50 text-emerald-900 ring-emerald-600/20",
  buy: "bg-amber-50 text-amber-900 ring-amber-600/20",
  ticket: "bg-surface-sunken text-ink-secondary ring-hairline",
  no: "bg-surface-sunken text-ink-secondary ring-hairline",
};

export default function AccessPanel({ access }: { access: Access }) {
  const { credentials, ready } = useWallet();
  const verdict = verdictFor(access, credentials);
  const personalised = ready && credentials.size > 0;

  // Routes keep their catalog grouping so "membership" always precedes "card",
  // and the reader can scan for the row that applies to them.
  const groups: { via: AccessVia; label: string; routes: Access["routes"] }[] = [];
  for (const route of access.routes) {
    const existing = groups.find((g) => g.via === route.via);
    if (existing) existing.routes.push(route);
    else groups.push({ via: route.via, label: GROUP_LABEL.get(route.via) ?? route.via, routes: [route] });
  }

  const facts: { label: string; value: string }[] = [
    { label: "Guests", value: access.guests },
    {
      label: "Day pass",
      value: access.dayPass ?? access.dayPassNote ?? "Not sold.",
    },
    { label: "Arriving", value: access.arrival },
  ];
  // When a lounge sells passes *and* has a caveat, both matter.
  if (access.dayPass && access.dayPassNote) {
    facts[1].value = `${access.dayPass} ${access.dayPassNote}`;
  }

  return (
    <div className="overflow-hidden rounded-[18px] bg-surface ring-1 ring-hairline">
      <div className="px-6 pt-6 pb-5">
        <h2 className="text-[15px] font-semibold text-ink">Getting in</h2>
        <p className="mt-2 text-[14px] leading-[1.55] text-ink-secondary">{access.summary}</p>

        {personalised && (
          <p
            className={`mt-4 flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-medium ring-1 ${
              VERDICT_STYLE[verdict.status]
            }`}
          >
            {verdict.status === "in" && <Check size={15} strokeWidth={2.5} aria-hidden="true" />}
            {STATUS_LABEL[verdict.status]}
          </p>
        )}
      </div>

      <div className="border-t border-hairline px-6 py-5">
        <h3 className="sr-only">Ways in</h3>
        {groups.map((group) => {
          const Icon = VIA_ICONS[group.via];
          return (
            <section key={group.via} className="mb-5 last:mb-0">
              <div className="mb-2 flex items-center gap-1.5">
                <Icon size={13} strokeWidth={1.9} aria-hidden="true" className="text-ink-tertiary" />
                <h4 className="text-[11px] font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
                  {group.label}
                </h4>
              </div>

              <ul className="space-y-2">
                {group.routes.map((route) => {
                  const yours = personalised && route.credential !== null && credentials.has(route.credential);
                  return (
                    <li key={`${route.via}-${route.label}`} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                          yours ? "bg-emerald-600" : "bg-hairline-strong"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`text-[14px] leading-snug ${yours ? "font-medium text-ink" : "text-ink"}`}>
                          {route.label}
                          {yours && (
                            <span className="ml-1.5 align-middle text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">
                              yours
                            </span>
                          )}
                        </p>
                        {route.note && (
                          <p className="mt-0.5 text-[12.5px] leading-[1.5] text-ink-tertiary">{route.note}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <dl className="border-t border-hairline px-6 py-5">
        {facts.map((fact) => (
          <div key={fact.label} className="mb-3 last:mb-0">
            <dt className="text-[11px] font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
              {fact.label}
            </dt>
            <dd className="mt-1 text-[13px] leading-[1.55] text-ink-secondary">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-hairline bg-surface-sunken px-6 py-5">
        <WalletSheet />
        <p className="mt-2.5 text-[12px] leading-relaxed text-ink-tertiary">
          {personalised
            ? "Checked against what you carry. Access rules change — confirm before you fly."
            : "Tell us once and every lounge will say whether you can walk in."}
        </p>
      </div>
    </div>
  );
}
