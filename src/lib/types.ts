export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cycle: "weekly" | "monthly" | "quarterly" | "yearly";
  category: string;
  region: string | null;
  startDate: string;
  nextBillDate: string | null;
  url: string | null;
  notes: string | null;
  active: boolean;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}
