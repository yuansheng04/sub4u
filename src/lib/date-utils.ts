import type { Subscription } from "./types";

// Compute the next bill date client-side (fallback for null)
export function calcNextBill(startDate: string, cycle: string): Date {
  const now = new Date();
  const next = new Date(startDate);
  let safety = 0;
  while (next <= now && safety < 5000) {
    safety++;
    switch (cycle) {
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
  }
  return next;
}

export function getNextBillDate(sub: Subscription): Date {
  if (sub.nextBillDate) return new Date(sub.nextBillDate);
  return calcNextBill(sub.startDate, sub.cycle);
}

// Generate all billing dates for a subscription in a given year
export function getBillingDatesInYear(
  sub: Subscription,
  year: number
): Date[] {
  const dates: Date[] = [];
  const start = new Date(sub.startDate);
  const cursor = new Date(start);
  let safety = 0;

  // Fast-forward to the year
  while (cursor.getFullYear() < year && safety < 5000) {
    safety++;
    switch (sub.cycle) {
      case "weekly":
        cursor.setDate(cursor.getDate() + 7);
        break;
      case "monthly":
        cursor.setMonth(cursor.getMonth() + 1);
        break;
      case "quarterly":
        cursor.setMonth(cursor.getMonth() + 3);
        break;
      case "yearly":
        cursor.setFullYear(cursor.getFullYear() + 1);
        break;
    }
  }

  // Step back one cycle
  const back = new Date(cursor);
  switch (sub.cycle) {
    case "weekly":
      back.setDate(back.getDate() - 7);
      break;
    case "monthly":
      back.setMonth(back.getMonth() - 1);
      break;
    case "quarterly":
      back.setMonth(back.getMonth() - 3);
      break;
    case "yearly":
      back.setFullYear(back.getFullYear() - 1);
      break;
  }
  if (back.getFullYear() === year) dates.push(new Date(back));

  // Collect dates in the year
  const c2 = new Date(cursor);
  let safety2 = 0;
  while (c2.getFullYear() === year && safety2 < 500) {
    safety2++;
    dates.push(new Date(c2));
    switch (sub.cycle) {
      case "weekly":
        c2.setDate(c2.getDate() + 7);
        break;
      case "monthly":
        c2.setMonth(c2.getMonth() + 1);
        break;
      case "quarterly":
        c2.setMonth(c2.getMonth() + 3);
        break;
      case "yearly":
        c2.setFullYear(c2.getFullYear() + 1);
        break;
    }
  }

  return dates;
}
