"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations, useFormatter } from "next-intl";
import type { Subscription } from "@/lib/types";
import { getBillingDatesInYear } from "@/lib/date-utils";
import { Favicon } from "./Favicon";

type CalendarLevel = "decade" | "year" | "month";

export function CalendarWidget({
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
  const today = new Date();
  const [level, setLevel] = useState<CalendarLevel>("year");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());

  // Measure day-grid width and derive responsive sizes
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState(0);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCellWidth(w / 7);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [level]);
  const dayFontSize = Math.max(10, cellWidth * 0.24);
  const dayIconSize = Math.max(6, Math.round(cellWidth * 0.16));

  // Locale-aware weekday narrow labels (Sunday-first; 2024-01-07 is a Sunday)
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    format.dateTime(new Date(2024, 0, 7 + i), { weekday: "narrow" })
  );
  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    format.dateTime(new Date(2024, i, 1), { month: "short" })
  );

  // Decade base (e.g. 2022 for 2022-2030)
  const decadeBase = Math.floor(year / 9) * 9;

  // Build month → subs map for current year
  const monthMap = useMemo(() => {
    const map: Record<number, { sub: Subscription; day: number }[]> = {};
    for (let m = 0; m < 12; m++) map[m] = [];
    const activeSubs = subs.filter((s) => s.active);
    for (const sub of activeSubs) {
      const dates = getBillingDatesInYear(sub, year);
      for (const d of dates) {
        if (d.getMonth() >= 0 && d.getMonth() < 12) {
          map[d.getMonth()].push({ sub, day: d.getDate() });
        }
      }
    }
    return map;
  }, [subs, year]);

  // Day map for current month
  const dayMap = useMemo(() => {
    const map: Record<number, Subscription[]> = {};
    for (const item of monthMap[month] || []) {
      (map[item.day] ||= []).push(item.sub);
    }
    return map;
  }, [monthMap, month]);

  // Year totals for decade view
  const yearTotals = useMemo(() => {
    if (level !== "decade") return {};
    const totals: Record<number, number> = {};
    const activeSubs = subs.filter((s) => s.active);
    for (let y = decadeBase; y < decadeBase + 9; y++) {
      let total = 0;
      for (const sub of activeSubs) {
        const dates = getBillingDatesInYear(sub, y);
        total += dates.length * convert(sub.amount, sub.currency);
      }
      totals[y] = total;
    }
    return totals;
  }, [subs, level, decadeBase, convert]);

  // Navigation handlers
  function prevMonth() {
    setSelectedDay(null);
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  }

  // ── Decade View (3x3 years) ──
  if (level === "decade") {
    const years = Array.from({ length: 9 }, (_, i) => decadeBase + i);
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setYear(year - 9)} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&lt;</button>
          <span className="font-semibold text-sm text-foreground/60">{decadeBase} - {decadeBase + 8}</span>
          <button onClick={() => setYear(year + 9)} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&gt;</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((y) => {
            const isCurrent = y === today.getFullYear();
            const total = yearTotals[y] || 0;
            return (
              <button
                key={y}
                onClick={() => { setYear(y); setLevel("year"); }}
                className={`rounded-lg p-3 text-center transition-colors ${
                  isCurrent
                    ? "bg-accent/10 border border-accent/30"
                    : "bg-background hover:bg-black/5 border border-border"
                }`}
              >
                <div className="text-sm font-semibold">{y}</div>
                {total > 0 && (
                  <div className="text-[10px] text-foreground/40 mt-0.5">{masked ? `${symbol}***` : `${symbol}${total.toFixed(0)}`}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Year View (4x3 months) ──
  if (level === "year") {
    const yearLabel = format.dateTime(new Date(year, 0, 1), { year: "numeric" });
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setYear(year - 1)} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&lt;</button>
          <button
            onClick={() => setLevel("decade")}
            className="group relative font-semibold text-sm transition-colors hover:text-accent"
          >
            {yearLabel}
            <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] text-foreground/0 group-hover:text-foreground/30 transition-colors whitespace-nowrap">
              {t("calendar.viewMoreYears")}
            </span>
          </button>
          <button onClick={() => setYear(year + 1)} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&gt;</button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {monthLabels.map((name, m) => {
            const items = monthMap[m];
            const count = items.length;
            const total = items.reduce((s, i) => s + convert(i.sub.amount, i.sub.currency), 0);
            const isCurrent = today.getFullYear() === year && today.getMonth() === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                onDoubleClick={() => { setMonth(m); setSelectedDay(null); setLevel("month"); }}
                className={`rounded-lg p-2 text-left transition-colors ${
                  selectedMonth === m
                    ? "bg-accent/10 border border-accent/30"
                    : isCurrent
                      ? "bg-accent/10 border border-accent/30"
                      : count > 0
                        ? "bg-background hover:bg-black/5 border border-border"
                        : "bg-background/50 hover:bg-black/5 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium">{name}</div>
                    {count > 0 ? (
                      <>
                        <div className="text-sm font-bold mt-0.5">{masked ? `${symbol}***` : `${symbol}${total.toFixed(0)}`}</div>
                        <div className="text-[10px] text-foreground/40">{t("calendar.billCount", { count })}</div>
                      </>
                    ) : (
                      <div className="text-[10px] text-foreground/20 mt-0.5">--</div>
                    )}
                  </div>
                  {count > 0 && (
                    <div className="flex flex-wrap gap-0.5 max-w-[36px] justify-end">
                      {/* Deduplicate by sub id, show up to 4 icons */}
                      {[...new Map(items.map((i) => [i.sub.id, i.sub])).values()].slice(0, 4).map((s) => (
                        <Favicon key={s.id} url={s.url} name={s.name} size={12} />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {(() => {
          const items = monthMap[selectedMonth] || [];
          const uniqueSubs = [...new Map(items.map((i) => [i.sub.id, i])).values()];
          const monthLabel = monthLabels[selectedMonth];
          return (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-[10px] text-foreground/40 mb-1">{monthLabel}</p>
              {uniqueSubs.length === 0 ? (
                <p className="text-xs text-foreground/30">{t("calendar.noRenewals")}</p>
              ) : (
                <div className="space-y-1">
                  {uniqueSubs.map(({ sub, day }) => (
                    <div key={`${sub.id}-${day}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Favicon url={sub.url} name={sub.name} size={14} />
                        <span>{sub.name}</span>
                        <span className="text-foreground/30">
                          {format.dateTime(new Date(year, selectedMonth, day), { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <span className="font-mono">{masked ? `${symbol}***` : `${symbol}${convert(sub.amount, sub.currency).toFixed(0)}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  // ── Month View (day grid) ──
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthTotal = Object.values(dayMap)
    .flat()
    .reduce((sum, s) => sum + convert(s.amount, s.currency), 0);

  const selectedSubs = selectedDay ? dayMap[selectedDay] || [] : [];
  const yearMonthLabel = format.dateTime(new Date(year, month, 1), { year: "numeric", month: "long" });
  const selectedDayLabel = selectedDay !== null
    ? format.dateTime(new Date(year, month, selectedDay), { month: "long", day: "numeric" })
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&lt;</button>
        <button
          onClick={() => setLevel("year")}
          className="group relative font-semibold text-sm transition-colors hover:text-accent"
        >
          {yearMonthLabel}
          {monthTotal > 0 && (
            <span className="text-xs text-foreground/40 font-normal ml-2">{masked ? `${symbol}***` : `${symbol}${monthTotal.toFixed(0)}`}</span>
          )}
          <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] text-foreground/0 group-hover:text-foreground/30 transition-colors whitespace-nowrap">
            {t("calendar.viewFullYear")}
          </span>
        </button>
        <button onClick={nextMonth} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&gt;</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {weekdayLabels.map((w, i) => (
          <div key={i} className="text-center text-[10px] text-foreground/30 py-0.5">{w}</div>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const isSelected = selectedDay === day;
          const billSubs = dayMap[day] || [];

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`flex flex-col items-center justify-center rounded transition-colors py-1.5 ${
                isSelected
                  ? "bg-accent text-white"
                  : isToday
                    ? "bg-accent/10 text-accent font-bold"
                    : "text-foreground/50 hover:bg-black/5"
              }`}
            >
              <span style={{ fontSize: dayFontSize, lineHeight: 1.2 }}>{day}</span>
              {billSubs.length > 0 && !isSelected && (
                <div className="flex gap-px mt-px">
                  {billSubs.slice(0, 3).map((s) => (
                    <Favicon key={s.id} url={s.url} name={s.name} size={dayIconSize} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] text-foreground/40 mb-1">{selectedDayLabel}</p>
          {selectedSubs.length === 0 ? (
            <p className="text-xs text-foreground/30">{t("calendar.noRenewals")}</p>
          ) : (
            <div className="space-y-1">
              {selectedSubs.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Favicon url={s.url} name={s.name} size={14} />
                    <span>{s.name}</span>
                  </div>
                  <span className="font-mono">{masked ? `${symbol}***` : `${symbol}${convert(s.amount, s.currency).toFixed(0)}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
