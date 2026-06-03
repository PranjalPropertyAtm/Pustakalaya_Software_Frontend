import { z } from "zod";

export const MOBILE_REGEX = /^[0-9]{10}$/;

export function digitsOnly(value: unknown, maxLen = 10): string {
  if (value == null) return "";
  return String(value).replace(/\D/g, "").slice(0, maxLen);
}

export const mobileNumberSchema = z
  .string()
  .trim()
  .regex(MOBILE_REGEX, "Mobile number must be exactly 10 digits");

export const optionalMobileSchema = z
  .union([
    z.literal(""),
    z.string().trim().regex(MOBILE_REGEX, "Contact must be exactly 10 digits"),
  ])
  .optional();
