import type { RatingSummary as Summary } from "@/lib/community";
import { Stars } from "@/components/Stars";

export default function RatingSummary({ summary }: { summary: Summary }) {
  const { average, count, counts } = summary;
  const max = Math.max(1, ...counts);

  return (
    <div className="flex flex-col gap-6 rounded-[14px] bg-surface p-5 ring-1 ring-hairline sm:flex-row sm:items-center sm:gap-10">
      <div className="shrink-0">
        <p className="text-[44px] leading-none font-semibold tracking-tight text-ink tabular-nums">
          {count > 0 ? average.toFixed(1) : "—"}
        </p>
        <div className="mt-2">
          <Stars value={average} size={16} />
        </div>
        <p className="mt-1.5 text-[13px] text-ink-tertiary">
          {count === 0 ? "No reviews yet" : `${count} review${count === 1 ? "" : "s"}`}
        </p>
      </div>

      <ol className="flex-1 space-y-1.5" aria-label="Ratings breakdown">
        {[4, 3, 2, 1, 0].map((i) => (
          <li key={i} className="flex items-center gap-3 text-[12px] text-ink-tertiary">
            <span className="w-3 text-right tabular-nums">{i + 1}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <span
                className="block h-full rounded-full bg-amber-500"
                style={{ width: `${(counts[i] / max) * 100}%` }}
              />
            </span>
            <span className="w-6 tabular-nums">{counts[i]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
