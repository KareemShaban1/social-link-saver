import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ARABIC_SCRIPT_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Detect whether text is predominantly Arabic (RTL) or Latin/English (LTR). */
export function getTextDirection(text: string): "rtl" | "ltr" {
  const trimmed = text.trim();
  if (!trimmed) return "ltr";

  let arabicCount = 0;
  let latinCount = 0;

  for (const char of trimmed) {
    if (ARABIC_SCRIPT_REGEX.test(char)) arabicCount += 1;
    else if (/[A-Za-z]/.test(char)) latinCount += 1;
  }

  if (arabicCount === 0 && latinCount === 0) return "ltr";
  return arabicCount >= latinCount ? "rtl" : "ltr";
}
