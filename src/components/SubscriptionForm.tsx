"use client";

import { useTranslations, useLocale } from "next-intl";
import { CURRENCIES, CATEGORY_KEYS, CYCLE_KEYS } from "@/lib/constants";
import { REGIONS, COMMON_CODES, REGION_MAP, getFlag } from "@/lib/regions";

export interface SubscriptionFormValues {
  name: string;
  amount: string;
  currency: string;
  cycle: string;
  category: string;
  region: string;
  startDate: string;
  nextBillDate: string;
  url: string;
  notes: string;
  shared: boolean;
}

export const EMPTY_FORM: SubscriptionFormValues = {
  name: "",
  amount: "",
  currency: "CNY",
  cycle: "monthly",
  category: "other",
  region: "",
  startDate: new Date().toISOString().split("T")[0],
  nextBillDate: "",
  url: "",
  notes: "",
  shared: false,
};

export function SubscriptionForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
}: {
  values: SubscriptionFormValues;
  onChange: (values: SubscriptionFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form
        onSubmit={onSubmit}
        className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
      >
        <h2 className="text-lg font-bold mb-4">
          {isEditing ? t("form.titleEdit") : t("form.titleAdd")}
        </h2>

        <div className="space-y-3">
          <input
            required
            placeholder={t("form.servicePlaceholder")}
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />

          <div className="flex gap-3">
            <input
              required
              type="number"
              step="0.01"
              placeholder={t("form.amountPlaceholder")}
              value={values.amount}
              onChange={(e) => onChange({ ...values, amount: e.target.value })}
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <select
              value={values.currency}
              onChange={(e) => onChange({ ...values, currency: e.target.value })}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <select
              value={values.cycle}
              onChange={(e) => onChange({ ...values, cycle: e.target.value })}
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {CYCLE_KEYS.map((key) => (
                <option key={key} value={key}>{t(`cycles.${key}`)}</option>
              ))}
            </select>
            <select
              value={values.category}
              onChange={(e) => onChange({ ...values, category: e.target.value })}
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>{t(`categories.${key}`)}</option>
              ))}
            </select>
          </div>

          <select
            value={values.region}
            onChange={(e) => onChange({ ...values, region: e.target.value })}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">{t("form.regionPlaceholder")}</option>
            <optgroup label={locale.startsWith("zh") ? "常用" : "Common"}>
              {COMMON_CODES.map((code) => {
                const r = REGION_MAP.get(code)!;
                return (
                  <option key={`c-${code}`} value={code}>
                    {getFlag(code)} {locale.startsWith("zh") ? r.zh : r.en}
                  </option>
                );
              })}
            </optgroup>
            <optgroup label={locale.startsWith("zh") ? "全部" : "All"}>
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {getFlag(r.code)} {locale.startsWith("zh") ? r.zh : r.en}
                </option>
              ))}
            </optgroup>
          </select>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-foreground/50 mb-1 block">{t("form.startDate")}</label>
              <input
                required
                type="date"
                value={values.startDate}
                onChange={(e) => onChange({ ...values, startDate: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-foreground/50 mb-1 block">{t("form.nextBillAuto")}</label>
              <input
                type="date"
                value={values.nextBillDate}
                onChange={(e) => onChange({ ...values, nextBillDate: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <input
            placeholder={t("form.urlPlaceholder")}
            value={values.url}
            onChange={(e) => onChange({ ...values, url: e.target.value })}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />

          <input
            placeholder={t("form.notesPlaceholder")}
            value={values.notes}
            onChange={(e) => onChange({ ...values, notes: e.target.value })}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.shared}
              onChange={(e) => onChange({ ...values, shared: e.target.checked })}
              className="accent-[#c96442] w-4 h-4"
            />
            <span className="text-sm text-foreground/70">{t("form.sharedLabel")}</span>
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-black/5 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {isEditing ? t("form.submitEdit") : t("form.submitAdd")}
          </button>
        </div>
      </form>
    </div>
  );
}
