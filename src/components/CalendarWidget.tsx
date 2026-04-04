"use client";

import { useState, useMemo } from "react";
import type { Subscription } from "@/lib/types";
import { WEEKDAYS, MONTH_NAMES } from "@/lib/constants";
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
  const today = new Date();
  const [level, setLevel] = useState<CalendarLevel>("year");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setYear(year - 1)} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&lt;</button>
          <button
            onClick={() => setLevel("decade")}
            className="group relative font-semibold text-sm transition-colors hover:text-accent"
          >
            {year}年
            <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] text-foreground/0 group-hover:text-foreground/30 transition-colors whitespace-nowrap">
              查看更多年份
            </span>
          </button>
          <button onClick={() => setYear(year + 1)} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&gt;</button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {MONTH_NAMES.map((name, m) => {
            const items = monthMap[m];
            const count = items.length;
            const total = items.reduce((s, i) => s + convert(i.sub.amount, i.sub.currency), 0);
            const isCurrent = today.getFullYear() === year && today.getMonth() === m;
            return (
              <button
                key={m}
                onClick={() => { setMonth(m); setSelectedDay(null); setLevel("month"); }}
                className={`rounded-lg p-2 text-left transition-colors ${
                  isCurrent
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
                        <div className="text-[10px] text-foreground/40">{count}笔</div>
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

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&lt;</button>
        <button
          onClick={() => setLevel("year")}
          className="group relative font-semibold text-sm transition-colors hover:text-accent"
        >
          {year}年{month + 1}月
          {monthTotal > 0 && (
            <span className="text-xs text-foreground/40 font-normal ml-2">{masked ? `${symbol}***` : `${symbol}${monthTotal.toFixed(0)}`}</span>
          )}
          <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] text-foreground/0 group-hover:text-foreground/30 transition-colors whitespace-nowrap">
            查看全年
          </span>
        </button>
        <button onClick={nextMonth} className="text-foreground/40 hover:text-foreground text-sm px-2 transition-colors">&gt;</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] text-foreground/30 py-0.5">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const hasBills = dayMap[day] && dayMap[day].length > 0;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const isSelected = selectedDay === day;

          const billSubs = dayMap[day] || [];

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`aspect-square flex flex-col items-center justify-center rounded text-xs transition-colors relative ${
                isSelected
                  ? "bg-accent text-white"
                  : isToday
                    ? "bg-accent/10 text-accent font-bold"
                    : hasBills
                      ? "bg-danger/10 text-danger font-medium"
                      : "text-foreground/50 hover:bg-black/5"
              }`}
            >
              <span>{day}</span>
              {hasBills && !isSelected && (
                <div className="flex gap-px mt-px">
                  {billSubs.slice(0, 3).map((s) => (
                    <Favicon key={s.id} url={s.url} name={s.name} size={8} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] text-foreground/40 mb-1">{month + 1}月{selectedDay}日</p>
          {selectedSubs.length === 0 ? (
            <p className="text-xs text-foreground/30">当日无续费</p>
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
