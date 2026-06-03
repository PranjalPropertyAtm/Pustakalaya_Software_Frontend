import type { FocusEvent } from "react";

export const MOBILE_LENGTH = 10;

export function digitsOnly(value: string, maxLen = MOBILE_LENGTH) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

export function trimInputValue(value: string) {
  return value.trim();
}

/** react-hook-form: mobile — digits only, max 10 */
export const mobileFieldRules = {
  maxLength: MOBILE_LENGTH,
  setValueAs: (v: unknown) => digitsOnly(String(v ?? ""), MOBILE_LENGTH),
} as const;

/** react-hook-form: trim whitespace on submit */
export const trimmedFieldRules = {
  setValueAs: (v: unknown) => (typeof v === "string" ? v.trim() : v),
} as const;

export function trimOnBlur<E extends HTMLInputElement | HTMLTextAreaElement>(
  e: FocusEvent<E>,
  onBlur?: (e: FocusEvent<E>) => void
) {
  const trimmed = e.target.value.trim();
  if (trimmed !== e.target.value) {
    e.target.value = trimmed;
    e.target.dispatchEvent(new Event("input", { bubbles: true }));
    e.target.dispatchEvent(new Event("change", { bubbles: true }));
  }
  onBlur?.(e);
}
