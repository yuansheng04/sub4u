"use client";

import { useTranslations, useFormatter } from "next-intl";
import type { Subscription } from "@/lib/types";
import { CYCLE_DAYS } from "@/lib/constants";
import { getNextBillDate } from "@/lib/date-utils";
import { Favicon } from "./Favicon";

export function TimelineView({
  subs,
  symbol,
  convert,
  masked,
}: {
  subs: Subscription[];
  symbol: string;
  convert: (amount: number, from: string) => number;
  masked: boolean;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const now = Date.now();

  const items = subs
    .filter((s) => s.active)
    .map((s) => {
      const nextDate = getNextBillDate(s);
      const nextMs = nextDate.getTime();
      const cycleDays = CYCLE_DAYS[s.cycle] || 30;
      const cycleMs = cycleDays * 86400000;
      const startOfCycle = nextMs - cycleMs;
      const elapsed = now - startOfCycle;
      const progress = Math.max(0, Math.min(1, elapsed / cycleMs));
      const daysLeft = Math.max(0, Math.ceil((nextMs - now) / 86400000));

      return { sub: s, progress, daysLeft, nextDate };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3">{t("timeline.title")}</h3>
      <div className={items.length > 2 ? "grid grid-cols-2 gap-x-4 gap-y-2.5" : "space-y-2.5"}>
        {items.map(({ sub, progress, daysLeft, nextDate }) => (
          <div key={sub.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs min-w-0">
                <Favicon url={sub.url} name={sub.name} size={14} />
                <span className="truncate">{sub.name}</span>
                <span className="text-foreground/30 font-mono shrink-0">
                  {masked ? `${symbol}***` : `${symbol}${convert(sub.amount, sub.currency).toFixed(0)}`}
                </span>
              </div>
              <span
                className="text-[11px] shrink-0 ml-2"
                style={{ color: `hsl(${(130 * (1 - progress)).toFixed(0)}, 65%, 45%)` }}
              >
                {daysLeft === 0
                  ? t("timeline.today")
                  : daysLeft === 1
                    ? t("timeline.tomorrow")
                    : t("timeline.daysLeft", { days: daysLeft })}
                <span className="text-foreground/30 ml-1">
                  {format.dateTime(nextDate, { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(progress * 100).toFixed(1)}%`,
                  backgroundColor: `hsl(${(130 * (1 - progress)).toFixed(0)}, 65%, 50%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
