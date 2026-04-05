"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useFormatter } from "next-intl";
import type { Subscription } from "@/lib/types";
import { CURRENCIES } from "@/lib/constants";
import { getNextBillDate } from "@/lib/date-utils";
import { Favicon } from "@/components/Favicon";
import { CalendarWidget } from "@/components/CalendarWidget";
import { TimelineView } from "@/components/TimelineView";
import {
  SubscriptionForm,
  EMPTY_FORM,
  type SubscriptionFormValues,
} from "@/components/SubscriptionForm";

export default function SubscriptionsPage() {
  const t = useTranslations();
  const format = useFormatter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubscriptionFormValues>(EMPTY_FORM);
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

  const convert = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (fromCurrency === displayCurrency || !rates) return amount;
      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[displayCurrency] || 1;
      return amount * (toRate / fromRate);
    },
    [rates, displayCurrency]
  );

  const symbol = CURRENCIES.find((c) => c.code === displayCurrency)?.symbol ?? "$";

  // Convert original amount to the selected price mode (daily/yearly/default)
  function toPriceMode(amount: number, cycle: string): number {
    if (priceMode === "default") return amount;
    let daily = amount;
    switch (cycle) {
      case "weekly": daily = amount / 7; break;
      case "monthly": daily = amount / 30; break;
      case "quarterly": daily = amount / 90; break;
      case "yearly": daily = amount / 365; break;
    }
    if (priceMode === "daily") return daily;
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
    if (!confirm(t("page.confirmDelete"))) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h1 className="text-2xl font-bold">{t("page.title")}</h1>
          <button
            onClick={() => setMasked(!masked)}
            className="text-foreground/30 hover:text-foreground/60 transition-colors text-lg"
            title={masked ? t("page.showAmount") : t("page.hideAmount")}
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
            {t("page.addSubscription")}
          </button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">{t("page.monthlyAvg")}</p>
          <p className="text-2xl font-bold">{symbol}{maskNum(monthlyTotal)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">{t("page.yearlyTotal")}</p>
          <p className="text-2xl font-bold">{symbol}{maskNum(yearlyTotal)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">{t("page.activeCount")}</p>
          <p className="text-2xl font-bold">{activeSubs.length}</p>
        </div>
      </div>

      {rates && rates["CNY"] && (
        <p className="text-xs text-foreground/30 mb-4">
          {t("page.exchangeRate", { rate: rates["CNY"].toFixed(4) })}
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
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("name")}>{t("table.service")}{sortIndicator("name")}</th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("category")}>{t("table.category")}{sortIndicator("category")}</th>
                <th className="text-right p-3">
                  <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("amount")}>{t("table.amount")}{sortIndicator("amount")}</span>
                  <button
                    onClick={cyclePriceMode}
                    className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    {t(`priceMode.${priceMode}`)}
                  </button>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("cycle")}>{t("table.cycle")}{sortIndicator("cycle")}</th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("nextBill")}>{t("table.nextBill")}{sortIndicator("nextBill")}</th>
                <th className="text-left p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("status")}>{t("table.status")}{sortIndicator("status")}</th>
                <th className="text-right p-3">{t("table.actions")}</th>
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
                        {t(`categories.${sub.category}`)}
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
                      {t(`cycles.${sub.cycle}`)}
                    </td>
                    <td className="p-3 text-foreground/60">
                      {format.dateTime(next, { year: "numeric", month: "short", day: "numeric" })}
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
                          {sub.active ? t("status.active") : t("status.inactive")}
                        </button>
                        {sub.shared && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#c96442] text-white">
                            {t("status.shared")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openEdit(sub)}
                        className="text-accent hover:text-accent-hover text-xs mr-3 transition-colors"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-foreground/30 hover:text-danger text-xs transition-colors"
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {subs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-foreground/30">
                    {t("page.empty")}
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
                <p className="text-xs text-foreground/50 mb-1">{t(`categories.${cat}`)}</p>
                <p className="text-lg font-bold">{symbol}{maskNum(total)}{t("page.perMonthSuffix")}</p>
                <p className="text-xs text-foreground/40">{t("page.itemCount", { count: items.length })}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 添加/编辑表单弹窗 */}
      {showForm && (
        <SubscriptionForm
          values={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          isEditing={!!editingId}
        />
      )}
    </div>
  );
}
