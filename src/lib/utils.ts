import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RUPEE_CURRENCY_CODES = new Set(["INR", "NPR"]);

/** Formats amounts with the ₹ symbol for INR (and legacy NPR records). */
export function formatCurrency(amount: number, currency = "INR") {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";

  const code = (currency || "INR").toUpperCase();
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);

  if (RUPEE_CURRENCY_CODES.has(code)) {
    return `₹${formatted}`;
  }

  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: code }).format(n);
  } catch {
    return `${code} ${formatted}`;
  }
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
