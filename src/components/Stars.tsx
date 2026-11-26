"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const ROW = [0, 1, 2, 3, 4];

/** Read-only stars with fractional fill, e.g. 4.3 fills the fifth star 30%. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
      className="relative inline-flex shrink-0 align-[-2px]"
    >
      <span className="flex gap-px text-ink/12">
        {ROW.map((i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-px overflow-hidden text-amber-500"
        style={{ width: `${pct}%` }}
      >
        {ROW.map((i) => (
          <Star
            key={i}
            size={size}
            fill="currentColor"
            strokeWidth={0}
            aria-hidden="true"
            className="shrink-0"
          />
        ))}
      </span>
    </span>
  );
}

const LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"];

/** A radio group under the hood, so it works with arrow keys and screen readers. */
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Your rating"
        className="flex"
        onMouseLeave={() => setHover(0)}
      >
        {ROW.map((i) => {
          const rating = i + 1;
          return (
            <label
              key={i}
              onMouseEnter={() => setHover(rating)}
              className="cursor-pointer rounded-[6px] p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
                className="sr-only"
                aria-label={`${rating} star${rating > 1 ? "s" : ""} — ${LABELS[i]}`}
              />
              <Star
                size={30}
                strokeWidth={1.4}
                aria-hidden="true"
                className={`transition-colors ${
                  rating <= shown ? "fill-amber-500 text-amber-500" : "fill-transparent text-ink/25"
                }`}
              />
            </label>
          );
        })}
      </div>
      <span className="text-[14px] font-medium text-ink-secondary">
        {shown ? LABELS[shown - 1] : "Tap to rate"}
      </span>
    </div>
  );
}
