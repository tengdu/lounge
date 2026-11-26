import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { lounges } from "@/data/lounges";
import AccountButton from "@/components/AccountButton";
import ModerationQueue from "@/components/ModerationQueue";

export const metadata: Metadata = {
  title: "Photo queue | Lounge",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  // Only the names cross to the client, not the whole lounge dataset.
  const names = Object.fromEntries(lounges.map((l) => [l.id, `${l.name} — ${l.airportCode}`]));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/72 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-4 px-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            All lounges
          </Link>
          <AccountButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <h1 className="text-display mb-2 text-[34px] text-ink">Photo queue</h1>
        <p className="mb-8 text-[15px] text-ink-secondary">
          Traveller photos wait here until approved. Rejecting deletes the file.
        </p>
        <ModerationQueue names={names} />
      </main>
    </>
  );
}
