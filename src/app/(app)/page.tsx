"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cycle: string;
  category: string;
  startDate: string;
  nextBillDate: string | null;
  url: string | null;
  notes: string | null;
  active: boolean;
  shared: boolean;
}

const CYCLES: Record<string, string> = {
  monthly: "月付",
  yearly: "年付",
  weekly: "周付",
  quarterly: "季付",
};

const CYCLE_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

const CATEGORIES = ["娱乐", "工具", "云服务", "AI", "音乐", "视频", "存储", "开发", "交易", "购物", "其他"];

const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: "CNY", symbol: "¥", label: "CNY ¥" },
  { code: "USD", symbol: "$", label: "USD $" },
  { code: "EUR", symbol: "€", label: "EUR €" },
  { code: "GBP", symbol: "£", label: "GBP £" },
  { code: "JPY", symbol: "¥", label: "JPY ¥" },
  { code: "HKD", symbol: "HK$", label: "HKD $" },
  { code: "KRW", symbol: "₩", label: "KRW ₩" },
  { code: "SGD", symbol: "S$", label: "SGD $" },
  { code: "CAD", symbol: "C$", label: "CAD $" },
  { code: "AUD", symbol: "A$", label: "AUD $" },
];
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function getFaviconUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

function getInitial(name: string): string {
  const ch = name.charAt(0);
  // If it's a letter, uppercase it
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
  return ch;
}

function Favicon({ url, name, size = 20 }: { url: string | null; name?: string; size?: number }) {
  const src = getFaviconUrl(url);
  if (!src) {
    const letter = name ? getInitial(name) : "?";
    return (
      <span
        className="rounded bg-accent/15 text-accent font-bold flex items-center justify-center shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {letter}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="rounded shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        // Replace with initial letter on error
        const span = document.createElement("span");
        span.className = "rounded bg-accent/15 text-accent font-bold flex items-center justify-center shrink-0";
        span.style.width = `${size}px`;
        span.style.height = `${size}px`;
        span.style.fontSize = `${size * 0.55}px`;
        span.textContent = name ? getInitial(name) : "?";
        el.replaceWith(span);
      }}
    />
  );
}

// Compute the next bill date client-side (fallback for null)
function calcNextBill(startDate: string, cycle: string): Date {
  const now = new Date();
  const next = new Date(startDate);
  let safety = 0;
  while (next <= now && safety < 5000) {
    safety++;
    switch (cycle) {
      case "weekly": next.setDate(next.getDate() + 7); break;
      case "monthly": next.setMonth(next.getMonth() + 1); break;
      case "quarterly": next.setMonth(next.getMonth() + 3); break;
      case "yearly": next.setFullYear(next.getFullYear() + 1); break;
      default: next.setMonth(next.getMonth() + 1);
    }
  }
  return next;
}

function getNextBillDate(sub: Subscription): Date {
  if (sub.nextBillDate) return new Date(sub.nextBillDate);
  return calcNextBill(sub.startDate, sub.cycle);
}

// Generate all billing dates for a subscription in a given year
function getBillingDatesInYear(sub: Subscription, year: number): Date[] {
  const dates: Date[] = [];
  const start = new Date(sub.startDate);
  const cursor = new Date(start);
  let safety = 0;

  // Fast-forward to the year
  while (cursor.getFullYear() < year && safety < 5000) {
    safety++;
    switch (sub.cycle) {
      case "weekly": cursor.setDate(cursor.getDate() + 7); break;
      case "monthly": cursor.setMonth(cursor.getMonth() + 1); break;
      case "quarterly": cursor.setMonth(cursor.getMonth() + 3); break;
      case "yearly": cursor.setFullYear(cursor.getFullYear() + 1); break;
    }
  }

  // Step back one cycle
  const back = new Date(cursor);
  switch (sub.cycle) {
    case "weekly": back.setDate(back.getDate() - 7); break;
    case "monthly": back.setMonth(back.getMonth() - 1); break;
    case "quarterly": back.setMonth(back.getMonth() - 3); break;
    case "yearly": back.setFullYear(back.getFullYear() - 1); break;
  }
  if (back.getFullYear() === year) dates.push(new Date(back));

  // Collect dates in the year
  const c2 = new Date(cursor);
  let safety2 = 0;
  while (c2.getFullYear() === year && safety2 < 500) {
    safety2++;
    dates.push(new Date(c2));
    switch (sub.cycle) {
      case "weekly": c2.setDate(c2.getDate() + 7); break;
      case "monthly": c2.setMonth(c2.getMonth() + 1); break;
      case "quarterly": c2.setMonth(c2.getMonth() + 3); break;
      case "yearly": c2.setFullYear(c2.getFullYear() + 1); break;
    }
  }

  return dates;
}

// ─── Three-level Calendar: Decade → Year → Month ───

type CalendarLevel = "decade" | "year" | "month";

function CalendarWidget({
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
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
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

// ─── Timeline Progress Bars ───

function TimelineView({
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
      <h3 className="font-semibold text-sm mb-3">续费进度</h3>
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
                {daysLeft === 0 ? "今天" : daysLeft === 1 ? "明天" : `${daysLeft}天`}
                <span className="text-foreground/30 ml-1">
                  {nextDate.getMonth() + 1}/{nextDate.getDate()}
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

// ─── Main Page ───

const EMPTY_FORM = {
  name: "",
  amount: "",
  currency: "CNY",
  cycle: "monthly",
  category: "其他",
  startDate: new Date().toISOString().split("T")[0],
  nextBillDate: "",
  url: "",
  notes: "",
  shared: false,
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [displayCurrency, setDisplayCurrency] = useState<string>("CNY");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [masked, setMasked] = useState(false);
  const [priceMode, setPriceMode] = useState<"default" | "daily" | "yearly">("default");

  const load = useCallback(async () => {
    const res = await fetch("/api/subscriptions");
    if (res.ok) setSubs(await res.json());
  }, []);

  const loadRate = useCallback(async () => {
    const res = await fetch("/api/exchange-rate");
    if (res.ok) {
      const data = await res.json();
      setRates(data.rates);
    }
  }, []);

  useEffect(() => {
    load();
    loadRate();
  }, [load, loadRate]);

  function convert(amount: number, fromCurrency: string): number {
    if (fromCurrency === displayCurrency || !rates) return amount;
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[displayCurrency] || 1;
    return amount * (toRate / fromRate);
  }

  const symbol = CURRENCIES.find((c) => c.code === displayCurrency)?.symbol ?? "$";

  // Convert original amount to the selected price mode (daily/yearly/default)
  function toPriceMode(amount: number, cycle: string): number {
    if (priceMode === "default") return amount;
    // First normalize to daily
    let daily = amount;
    switch (cycle) {
      case "weekly": daily = amount / 7; break;
      case "monthly": daily = amount / 30; break;
      case "quarterly": daily = amount / 90; break;
      case "yearly": daily = amount / 365; break;
    }
    if (priceMode === "daily") return daily;
    // yearly
    return daily * 365;
  }

  function formatAmount(amount: number, fromCurrency: string, cycle: string): string {
    if (masked) return `${symbol}***`;
    const moded = toPriceMode(amount, cycle);
    return `${symbol}${convert(moded, fromCurrency).toFixed(2)}`;
  }

  function formatOriginal(amount: number, currencyCode: string, cycle: string): string {
    if (masked) return "***";
    const moded = toPriceMode(amount, cycle);
    const cs = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "";
    return `${cs}${moded.toFixed(2)}`;
  }

  const PRICE_MODE_LABEL: Record<string, string> = {
    default: "默认",
    daily: "日化",
    yearly: "年化",
  };

  function cyclePriceMode() {
    setPriceMode((m) => m === "default" ? "daily" : m === "daily" ? "yearly" : "default");
  }

  function maskNum(value: number | string): string {
    if (masked) return "***";
    return typeof value === "number" ? value.toFixed(0) : String(value);
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(sub: Subscription) {
    setEditingId(sub.id);
    setForm({
      name: sub.name,
      amount: String(sub.amount),
      currency: sub.currency,
      cycle: sub.cycle,
      category: sub.category,
      startDate: sub.startDate.split("T")[0],
      nextBillDate: sub.nextBillDate ? sub.nextBillDate.split("T")[0] : "",
      url: sub.url || "",
      notes: sub.notes || "",
      shared: sub.shared,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount),
      nextBillDate: form.nextBillDate || null,
      url: form.url || null,
      notes: form.notes || null,
      shared: form.shared,
    };

    if (editingId) {
      await fetch(`/api/subscriptions/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowForm(false);
    setEditingId(null);
    load();
  }

  async function toggleActive(sub: Subscription) {
    await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !sub.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此订阅？")) return;
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    load();
  }

  function toMonthly(sub: Subscription): number {
    let monthly = sub.amount;
    if (sub.cycle === "yearly") monthly = sub.amount / 12;
    else if (sub.cycle === "weekly") monthly = sub.amount * 4.33;
    else if (sub.cycle === "quarterly") monthly = sub.amount / 3;
    return convert(monthly, sub.currency);
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIndicator(key: string) {
    if (sortKey !== key) return " ↕";
    return sortDir === "desc" ? " ↓" : " ↑";
  }

  const sortedSubs = useMemo(() => {
    if (!sortKey) return subs;
    const sorted = [...subs].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
        case "amount":
          cmp = convert(toPriceMode(a.amount, a.cycle), a.currency) - convert(toPriceMode(b.amount, b.cycle), b.currency);
          break;
        case "cycle": {
          const order: Record<string, number> = { weekly: 0, monthly: 1, quarterly: 2, yearly: 3 };
          cmp = (order[a.cycle] ?? 9) - (order[b.cycle] ?? 9);
          break;
        }
        case "nextBill":
          cmp = getNextBillDate(a).getTime() - getNextBillDate(b).getTime();
          break;
        case "status": {
          const av = (a.active ? 1 : 0) * 10 + (a.shared ? 1 : 0);
          const bv = (b.active ? 1 : 0) * 10 + (b.shared ? 1 : 0);
          cmp = av - bv;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [subs, sortKey, sortDir, displayCurrency, rates, priceMode]);

  const activeSubs = subs.filter((s) => s.active);
  const monthlyTotal = activeSubs.reduce((sum, s) => sum + toMonthly(s), 0);
  const yearlyTotal = monthlyTotal * 12;

  const grouped = activeSubs.reduce<Record<string, Subscription[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">订阅</h1>
          <button
            onClick={() => setMasked(!masked)}
            className="text-foreground/30 hover:text-foreground/60 transition-colors text-lg"
            title={masked ? "显示金额" : "隐藏金额"}
          >
            {masked ? "🙈" : "👁"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={openAdd}
            className="bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            + 添加订阅
          </button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">月均支出</p>
          <p className="text-2xl font-bold">{symbol}{maskNum(monthlyTotal)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">年度支出</p>
          <p className="text-2xl font-bold">{symbol}{maskNum(yearlyTotal)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">活跃订阅</p>
          <p className="text-2xl font-bold">{activeSubs.length}</p>
        </div>
      </div>

      {rates && rates["CNY"] && (
        <p className="text-xs text-foreground/30 mb-4">
          汇率: 1 USD = {rates["CNY"].toFixed(4)} CNY
        </p>
      )}

      {/* Calendar + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CalendarWidget subs={subs} symbol={symbol} convert={convert} masked={masked} />
        <TimelineView subs={subs} symbol={symbol} convert={convert} masked={masked} />
      </div>

      {/* 订阅列表 */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-foreground/50 border-b border-border select-none">
              <tr>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("name")}>服务{sortIndicator("name")}</th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("category")}>分类{sortIndicator("category")}</th>
                <th className="text-right p-3">
                  <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("amount")}>金额{sortIndicator("amount")}</span>
                  <button
                    onClick={cyclePriceMode}
                    className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    {PRICE_MODE_LABEL[priceMode]}
                  </button>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("cycle")}>周期{sortIndicator("cycle")}</th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("nextBill")}>下次扣费{sortIndicator("nextBill")}</th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("status")}>状态{sortIndicator("status")}</th>
                <th className="text-right p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubs.map((sub) => {
                const next = getNextBillDate(sub);
                return (
                  <tr
                    key={sub.id}
                    className={`border-b border-border/50 hover:bg-black/[0.02] ${
                      !sub.active ? "opacity-40" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Favicon url={sub.url} name={sub.name} />
                        <div>
                          <div className="font-medium">{sub.name}</div>
                          {sub.notes && (
                            <div className="text-xs text-foreground/40 mt-0.5">{sub.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {sub.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="flex items-baseline justify-end gap-3">
                        <span className="tabular-nums">{formatAmount(sub.amount, sub.currency, sub.cycle)}</span>
                        <span className="text-[11px] text-foreground/30 tabular-nums w-20 text-right">
                          {formatOriginal(sub.amount, sub.currency, sub.cycle)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-foreground/60">
                      {CYCLES[sub.cycle] || sub.cycle}
                    </td>
                    <td className="p-3 text-foreground/60">
                      {next.toLocaleDateString("zh-CN")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleActive(sub)}
                          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                            sub.active
                              ? "bg-success/10 text-success"
                              : "bg-foreground/10 text-foreground/40"
                          }`}
                        >
                          {sub.active ? "活跃" : "已停"}
                        </button>
                        {sub.shared && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#c96442] text-white">
                            合租
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openEdit(sub)}
                        className="text-accent hover:text-accent-hover text-xs mr-3 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-foreground/30 hover:text-danger text-xs transition-colors"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
              {subs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-foreground/30">
                    暂无订阅，点击右上角添加
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分类汇总 */}
      {Object.keys(grouped).length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(grouped).map(([cat, items]) => {
            const total = items.reduce((s, i) => s + toMonthly(i), 0);
            return (
              <div key={cat} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-foreground/50 mb-1">{cat}</p>
                <p className="text-lg font-bold">{symbol}{maskNum(total)}/月</p>
                <p className="text-xs text-foreground/40">{items.length} 项</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 添加/编辑表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
          >
            <h2 className="text-lg font-bold mb-4">
              {editingId ? "编辑订阅" : "添加订阅"}
            </h2>

            <div className="space-y-3">
              <input
                required
                placeholder="服务名称"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />

              <div className="flex gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="金额"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <select
                  value={form.cycle}
                  onChange={(e) => setForm({ ...form, cycle: e.target.value })}
                  className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="monthly">月付</option>
                  <option value="yearly">年付</option>
                  <option value="quarterly">季付</option>
                  <option value="weekly">周付</option>
                </select>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-foreground/50 mb-1 block">开始日期</label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-foreground/50 mb-1 block">下次扣费（自动推算）</label>
                  <input
                    type="date"
                    value={form.nextBillDate}
                    onChange={(e) => setForm({ ...form, nextBillDate: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <input
                placeholder="服务网址（可选）"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />

              <input
                placeholder="备注（可选）"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.shared}
                  onChange={(e) => setForm({ ...form, shared: e.target.checked })}
                  className="accent-[#c96442] w-4 h-4"
                />
                <span className="text-sm text-foreground/70">合租</span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-black/5 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                {editingId ? "保存" : "添加"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
