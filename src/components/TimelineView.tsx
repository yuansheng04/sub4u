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
      <div className="space-y-2.5">
        {items.map(({ sub, progress, daysLeft, nextDate }) => (
          <div key={sub.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs">
                <Favicon url={sub.url} name={sub.name} size={14} />
                <span>{sub.name}</span>
                <span className="text-foreground/30 font-mono">
                  {masked ? `${symbol}***` : `${symbol}${convert(sub.amount, sub.currency).toFixed(0)}`}
                </span>
              </div>
              <span className={`text-[11px] ${daysLeft <= 3 ? "text-danger font-medium" : daysLeft <= 7 ? "text-amber-500" : "text-foreground/40"}`}>
                {daysLeft === 0
                  ? t("timeline.today")
                  : daysLeft === 1
                    ? t("timeline.tomorrow")
                    : t("timeline.daysLeft", { days: daysLeft })}
                <span className="text-foreground/30 ml-1">
                  {format.dateTime(nextDate, { month: "numeric", day: "numeric" })}
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  daysLeft <= 3 ? "bg-danger" : daysLeft <= 7 ? "bg-amber-400" : "bg-accent"
                }`}
                style={{ width: `${(progress * 100).toFixed(1)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
