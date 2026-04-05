"use client";

import { CURRENCIES, CATEGORIES } from "@/lib/constants";

export interface SubscriptionFormValues {
  name: string;
  amount: string;
  currency: string;
  cycle: string;
  category: string;
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
  category: "其他",
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
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form
        onSubmit={onSubmit}
        className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
      >
        <h2 className="text-lg font-bold mb-4">
          {isEditing ? "编辑订阅" : "添加订阅"}
        </h2>

        <div className="space-y-3">
          <input
            required
            placeholder="服务名称"
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />

          <div className="flex gap-3">
            <input
              required
              type="number"
              step="0.01"
              placeholder="金额"
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
              <option value="monthly">月付</option>
              <option value="yearly">年付</option>
              <option value="quarterly">季付</option>
              <option value="weekly">周付</option>
            </select>
            <select
              value={values.category}
              onChange={(e) => onChange({ ...values, category: e.target.value })}
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
                value={values.startDate}
                onChange={(e) => onChange({ ...values, startDate: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-foreground/50 mb-1 block">下次扣费（自动推算）</label>
              <input
                type="date"
                value={values.nextBillDate}
                onChange={(e) => onChange({ ...values, nextBillDate: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <input
            placeholder="服务网址（可选）"
            value={values.url}
            onChange={(e) => onChange({ ...values, url: e.target.value })}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />

          <input
            placeholder="备注（可选）"
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
            <span className="text-sm text-foreground/70">合租</span>
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-black/5 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {isEditing ? "保存" : "添加"}
          </button>
        </div>
      </form>
    </div>
  );
}
