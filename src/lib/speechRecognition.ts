import type { Locale } from "@/i18n";

export const SPEECH_LOCALE_STORAGE_KEY = "socialsaver-speech-locale";

type SpeechRecognitionConstructor = new () => AppSpeechRecognition;

export interface AppSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: AppSpeechRecognitionEvent) => void) | null;
}

export interface AppSpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

function getWindowWithSpeech(): Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
} {
  return window;
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = getWindowWithSpeech();
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!getSpeechRecognitionConstructor() && window.isSecureContext;
}

export function isInsecureContext(): boolean {
  return typeof window !== "undefined" && !window.isSecureContext;
}

export function speechLocaleToBcp47(locale: Locale): string {
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  const navLower = nav.toLowerCase();
  if (locale === "ar") {
    return navLower.startsWith("ar") ? nav : "ar-SA";
  }
  return navLower.startsWith("en") ? nav : "en-US";
}

export function readStoredSpeechLocale(fallback: Locale): Locale {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(SPEECH_LOCALE_STORAGE_KEY);
  return stored === "ar" || stored === "en" ? stored : fallback;
}

export function persistSpeechLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SPEECH_LOCALE_STORAGE_KEY, locale);
}

export function joinSpeechParts(prefix: string, finalText: string, interimText: string): string {
  return [prefix.trimEnd(), finalText.trim(), interimText.trim()].filter(Boolean).join(" ");
}
